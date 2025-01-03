import asyncio
from telethon import TelegramClient
from kafka import KafkaProducer
import logging
from datetime import datetime, timedelta, timezone
from TelegramKey import *

import telethon

# Configure logging
logging.basicConfig(
    format="%(asctime)s - %(levelname)s - %(message)s",
    level=logging.INFO
)

# Kafka
kafka_server = 'localhost:9092'
kafka_topic = 'road-raw-messages'

group_names = ['ahwalaltreq', 'ahwalaltareq', 'a7walstreet', 'ahwalaltareq']
group_admins = {}

producer = KafkaProducer(
    bootstrap_servers=kafka_server,
    value_serializer=lambda v: v.encode('utf-8'),
    key_serializer=lambda k: k.encode('utf-8')
)


def push_to_kafka(producer, topic, key, message):
    try:
        producer.send(topic, key=key, value=message)
    except Exception as e:
        logging.error(f"Failed to send message to Kafka: {e}")

async def fetch_admins():
    async with TelegramClient('auth', api_id, api_hash) as client:
        for group_name in group_names:
            try:
                logging.info(f"Fetching admin list for group: {group_name}")
                admins = await client.get_participants(group_name, filter=telethon.tl.types.ChannelParticipantsAdmins)
                admin_ids = [admin.id for admin in admins]
                group_admins[group_name] = admin_ids
                logging.info(f"Fetched {len(admin_ids)} admins for group: {group_name}")
            except Exception as e:
                logging.error(f"Failed to fetch admin list for {group_name}: {e}")
                group_admins[group_name] = []

async def process_completed_hours(hourly_buckets, last_processed_hour, group_names):
    processed_hours = {}
    completed_hours = [
        h for h in hourly_buckets
        if all(last_processed_hour[group] > h for group in group_names)  # Ensure all groups moved past the hour
    ]

    for completed_hour in completed_hours:
        processed_hours = {}
        messages = hourly_buckets.pop(completed_hour)
        
        for message in messages:
            group_name = message["group"]
            if group_name not in processed_hours:
                processed_hours[group_name] = 0
            processed_hours[group_name]+=1

        for kafka_message in messages:
            push_to_kafka(producer, kafka_topic, key=str(completed_hour), message=str(kafka_message))
        logging.info(f"Pushed messages for hour {completed_hour} to Kafka.")

    return processed_hours


async def fetch_and_publish_messages(lookbackPeriodInDays=7):
    async with TelegramClient('auth', api_id, api_hash) as client:
        endTime = datetime.utcnow().replace(tzinfo=timezone.utc)
        startTime = (datetime.utcnow() - timedelta(days=lookbackPeriodInDays)).replace(tzinfo=timezone.utc)

        # Initialize offset_date, limit, and a global hourly bucket
        offset_date = {group_name: startTime for group_name in group_names}
        limit = {group_name: 50 for group_name in group_names}  # Starting limit for each group
        hourly_buckets = {}  # {hour: [messages]}
        last_processed_hour = {group_name: startTime.replace(minute=0, second=0, microsecond=0) for group_name in group_names}

        while any(offset_date[group] < endTime for group in group_names):
            for group_name in group_names:
                try:
                    async for message in client.iter_messages(group_name, reverse=True, offset_date=offset_date[group_name], limit=limit[group_name]):
                        offset_date[group_name] = message.date + timedelta(seconds=1)

                        if message.text:
                            is_admin = message.sender_id in group_admins.get(group_name, [])
                            sent_time = message.date.astimezone(timezone.utc)
                            hour = sent_time.replace(minute=0, second=0, microsecond=0)

                            is_reply = message.reply_to_msg_id is not None
                            original_message_text = None
                            if is_reply:
                                try:
                                    original_message = await client.get_messages(group_name, ids=message.reply_to_msg_id)
                                    if original_message and original_message.text:
                                        original_message_text = original_message.text
                                except Exception as e:
                                    logging.error(f"Failed to fetch original message for reply in {group_name}: {e}")

                            if hour not in hourly_buckets:
                                hourly_buckets[hour] = []
                            hourly_buckets[hour].append({
                                "group": group_name,
                                "sentTime": sent_time.isoformat(),
                                "text": f"{original_message_text} => {message.text}" if original_message_text else message.text,
                                "isAdmin": is_admin,
                                "isReply": is_reply,
                                "messageId": message.id
                            })

                            last_processed_hour[group_name] = max(last_processed_hour[group_name], hour)

                except Exception as e:
                    logging.error(f"Failed to fetch messages from {group_name}: {e}")

            processed_hours = await process_completed_hours(hourly_buckets, last_processed_hour, group_names)

            for group_name in group_names:
                if group_name in processed_hours:
                    limit[group_name] = max(processed_hours[group_name], 10)

            await asyncio.sleep(1)

        for hour, messages in hourly_buckets.items():
            for kafka_message in messages:
                push_to_kafka(producer, kafka_topic, key=str(hour), message=str(kafka_message))
            logging.info(f"Pushed remaining messages for hour {hour} to Kafka.")


if __name__ == "__main__":
    try:
        logging.info("Starting Telegram to Kafka service...")
        asyncio.run(fetch_admins())
        asyncio.run(fetch_and_publish_messages(14))
    except KeyboardInterrupt:
        logging.info("Service terminated by user.")
    except Exception as e:
        logging.error(f"Unexpected error: {e}")