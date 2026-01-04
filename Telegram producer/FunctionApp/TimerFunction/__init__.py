import azure.functions as func
import asyncio
import logging
from telethon import TelegramClient
from datetime import timezone
import telethon
from pymongo import MongoClient
import os

# Configure logging
logging.basicConfig(
    format="%(asctime)s - %(levelname)s - %(message)s",
    level=logging.INFO
)

# Telegram credentials - should be set as Azure Function App Settings
api_id = os.environ.get('TELEGRAM_API_ID', '23333158')
api_hash = os.environ.get('TELEGRAM_API_HASH', '597dbd2f898a10253436be68434e1ea9')
phone = os.environ.get('TELEGRAM_PHONE', '+970598176971')

# MongoDB connection - should be set as Azure Function App Setting
mongo_connection_string = os.environ.get('MONGODB_CONNECTION_STRING', 
    'mongodb+srv://alaaodeh:Cersi1995%3F@roads-db.ddnkb.mongodb.net/?retryWrites=true&w=majority&appName=roads-db')

group_names = ['ahwalaltreq', 'ahwalaltareq', 'a7walstreet', 'road_jehad', 'hhshehheheu']

# Cache for group admins (persisted in blob storage between runs)
group_admins = {}

# MongoDB client (reused across invocations)
mongo_client = None
collection = None

def get_mongo_collection():
    """Lazy initialization of MongoDB connection for reuse across invocations"""
    global mongo_client, collection
    if mongo_client is None:
        mongo_client = MongoClient(mongo_connection_string)
        collection = mongo_client["RoadsConditions"]["Messages"]
    return collection

async def fetch_admins(client, group_name):
    """Fetch admin list for a group"""
    try:
        logging.info(f"Fetching admin list for group: {group_name}")
        admins = await client.get_participants(group_name, filter=telethon.tl.types.ChannelParticipantsAdmins)
        admin_ids = [admin.id for admin in admins]
        group_admins[group_name] = admin_ids
        logging.info(f"Fetched {len(admin_ids)} admins for group: {group_name}")
    except Exception as e:
        logging.error(f"Failed to fetch admin list for {group_name}: {e}")
        group_admins[group_name] = []

async def process_messages():
    """Main async function to fetch and store messages from Telegram groups"""
    # Use /tmp directory for session file (Azure Functions writable location)
    session_path = os.path.join('/tmp', 'auth')
    
    # Copy pre-authenticated session file to /tmp if it exists in function directory
    source_session = os.path.join(os.path.dirname(__file__), 'auth.session')
    dest_session = session_path + '.session'
    
    if os.path.exists(source_session) and not os.path.exists(dest_session):
        import shutil
        shutil.copy2(source_session, dest_session)
        logging.info(f"Copied session file to {dest_session}")
    
    async with TelegramClient(session_path, api_id, api_hash) as client:
        logging.info("Telegram client started.")
        
        # Get MongoDB collection
        collection = get_mongo_collection()
        
        # Fetch admin lists for groups that don't have cached admins
        for group_name in group_names:
            if group_name not in group_admins:
                await fetch_admins(client, group_name)
        
        # Process messages from each group
        for group_name in group_names:
            try:
                logging.info(f"Processing messages from group: {group_name}")
                
                # Get the last processed message ID from MongoDB
                last_message = collection.find_one(
                    {"group": group_name},
                    sort=[("messageId", -1)]
                )
                last_processed_id = last_message["messageId"] if last_message else 0
                
                messages_to_insert = []
                processed_count = 0
                
                # Fetch recent messages (limit 20 to reduce API calls)
                async for message in client.iter_messages(group_name, limit=20):
                    # Stop if we've reached already processed messages
                    if message.id <= last_processed_id:
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
                        
                        message_doc = {
                            "group": group_name,
                            "sentTime": sent_time,
                            "text": text,
                            "isAdmin": is_admin,
                            "isReply": is_reply,
                            "messageId": message.id
                        }
                        messages_to_insert.append(message_doc)
                        processed_count += 1
                
                # Bulk insert for better performance
                if messages_to_insert:
                    collection.insert_many(messages_to_insert)
                    logging.info(f"Inserted {len(messages_to_insert)} new messages from {group_name}")
                else:
                    logging.info(f"No new messages from {group_name}")
                    
            except Exception as e:
                logging.error(f"Failed to process messages from {group_name}: {e}")

async def main(mytimer: func.TimerRequest) -> None:
    """Azure Function entry point triggered every 2 minutes"""
    utc_timestamp = mytimer.schedule_status.get('Last')
    
    logging.info(f'Python timer trigger function executed at: {utc_timestamp}')
    
    try:
        await process_messages()
        logging.info('Successfully processed messages from all groups')
    except Exception as e:
        logging.error(f'Error processing messages: {e}')
        raise
