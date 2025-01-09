import asyncio
from telethon import TelegramClient
from kafka import KafkaProducer
import logging
from datetime import datetime, timezone
import telethon

api_id = '23333158'
api_hash = '597dbd2f898a10253436be68434e1ea9'
phone = '+970598176971'

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
last_processed_message = {group_name: 0 for group_name in group_names}

producer = KafkaProducer(
    bootstrap_servers=kafka_server,
    value_serializer=lambda v: v.encode('utf-8'),
    key_serializer=lambda k: k.encode('utf-8')
)

async def fetch_admins(client, group_name):
    try:
        logging.info(f"Fetching admin list for group: {group_name}")
        admins = await client.get_participants(group_name, filter=telethon.tl.types.ChannelParticipantsAdmins)
        admin_ids = [admin.id for admin in admins]
        group_admins[group_name] = admin_ids
        logging.info(f"Fetched {len(admin_ids)} admins for group: {group_name}")
    except Exception as e:
        logging.error(f"Failed to fetch admin list for {group_name}: {e}")
        group_admins[group_name] = []

def push_to_kafka(producer, topic, key, message):
    try:
        producer.send(topic, key=key, value=message)
    except Exception as e:
        logging.error(f"Failed to send message to Kafka: {e}")

async def fetch_and_publish_messages():
    async with TelegramClient('auth', api_id, api_hash) as client:
        logging.info("Telegram client started.")

        # Fetch admin lists on startup
        for group_name in group_names:
            await fetch_admins(client, group_name)

        while True:
            for group_name in group_names:
                try:
                    first_message = 0
                    msg_idx = 0
                    async for message in client.iter_messages(group_name, limit=10):
                        if msg_idx == 0:
                            first_message = message
                            msg_idx = msg_idx + 1
                        if last_processed_message[group_name] == message.id:
                            break
                        if message.text:
                            is_admin = message.sender_id in group_admins.get(group_name, [])
                            sent_time = message.date.astimezone(timezone.utc).isoformat()

                            text = message.text                       
                            # Check if the message is a reply
                            is_reply = message.reply_to_msg_id is not None
                            if is_reply:
                                try:
                                    original_message = await client.get_messages(group_name, ids=message.reply_to_msg_id)
                                    if original_message and original_message.text:
                                        text = f"{original_message.text} => {text}"
                                except Exception as e:
                                    logging.error(f"Failed to fetch original message for reply in {group_name}: {e}")

                            kafka_message = {
                                "group": group_name,
                                "sentTime": sent_time,
                                "text": text,
                                "isAdmin": is_admin,
                                "isReply": is_reply,
                                "messageId": message.id
                            }
                            push_to_kafka(producer, kafka_topic, key=group_name, message=str(kafka_message))
                    last_processed_message[group_name] = first_message.id
                except Exception as e:
                    logging.error(f"Failed to fetch messages from {group_name}: {e}")

            await asyncio.sleep(5)

if __name__ == "__main__":
    try:
        logging.info("Starting Telegram to Kafka service...")
        asyncio.run(fetch_and_publish_messages())
    except KeyboardInterrupt:
        logging.info("Service terminated by user.")
    except Exception as e:
        logging.error(f"Unexpected error: {e}")