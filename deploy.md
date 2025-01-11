# Access
ssh alaaodeh@52.168.181.252

# Zookeeper service
`sudo nano /etc/systemd/system/zookeeper.service`

`sudo systemctl daemon-reload`

`sudo systemctl enable zookeeper`

`sudo systemctl start zookeeper`

`sudo systemctl status zookeeper`

# Kafka service
`sudo nano /etc/systemd/system/kafka.service`

`sudo systemctl daemon-reload`

`sudo systemctl enable kafka.service`

`sudo systemctl start kafka.service`

`sudo systemctl status kafka`

# Sparkjob1 service
`sudo nano /etc/systemd/system/spark-job-1.service`

`sudo systemctl daemon-reload`

`sudo systemctl enable spark-job-1.service`

`sudo systemctl start spark-job-1.service`

`sudo systemctl status spark-job-1.service`

# Sparkjob2 service
`sudo nano /etc/systemd/system/spark-job-2.service`

`sudo systemctl daemon-reload`

`sudo systemctl enable spark-job-2.service`

`sudo systemctl start spark-job-2.service`

`sudo systemctl status spark-job-2.service`

# Telegram producer service
`sudo nano /etc/systemd/system/kafka-producer.service`

`sudo systemctl daemon-reload`

`sudo systemctl enable kafka-producer.service`

`sudo systemctl start kafka-producer.service`

`sudo systemctl status kafka-producer.service`

# Telegram producer timer service
`sudo nano /etc/systemd/system/kafka-producer.timer`

`sudo systemctl daemon-reload`

`sudo systemctl enable kafka-producer.timer`

`sudo systemctl start kafka-producer.timer`

`sudo systemctl status kafka-producer.timer`


# Spark Job 1 service definition
[Unit]
Description=Spark Job 1
After=network.target

[Service]
ExecStart=/opt/spark/bin/spark-submit --class org.aladdin.roadsconditions.MainDispatcher \
  --master local[1] \
  --deploy-mode client \
  --conf spark.executor.memory=1g \
  --conf spark.executor.cores=1 \
  /home/alaaodeh/RoadsConditions.jar \
  RawRoadMessagesConsumer \
  /home/alaaodeh/filter.bloom \
  /home/alaaodeh/checkpoints/RawRoadDataConsumer
Restart=always
User=alaaodeh
Group=alaaodeh
WorkingDirectory=/home/alaaodeh
SyslogIdentifier=spark-job-1

[Install]
WantedBy=multi-user.target


# Spark Job 2 service definition

[Unit]
Description=Spark Job 2
After=network.target

[Service]
ExecStart=/opt/spark/bin/spark-submit --class org.aladdin.roadsconditions.MainDispatcher \
  --master local[1] \
  --deploy-mode client \
  --conf spark.executor.memory=1g \
  --conf spark.executor.cores=1 \
  /home/alaaodeh/RoadsConditions.jar \
  StructuredMessagesAggregator \
  /home/alaaodeh/checkpoints/StructuredMessagesAggregator
Restart=always
User=alaaodeh
Group=alaaodeh
WorkingDirectory=/home/alaaodeh
SyslogIdentifier=spark-job-2

[Install]
WantedBy=multi-user.target


# Telegram producer service definition

[Unit]
Description=Kafka Producer Service
After=network.target

[Service]
# Set the Python interpreter and script path
ExecStart=/home/alaaodeh/Python-3.9.6/myenv39/bin/python3.9 /home/alaaodeh/producer.py
WorkingDirectory=/home/alaaodeh
User=alaaodeh
Group=alaaodeh

# Restart service on failure
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target

# Telegram producer timer
[Unit]
Description=Restart kafka-producer every 2 hours

[Timer]
OnCalendar=*-*-* *:00/120
Unit=kafka-producer.service

[Install]
WantedBy=timers.target

# Copy JAR
scp /Users/alaaodeh/Desktop/Projects/big\ data/RoadsCondition/RoadsConditionsPipeline/target/scala-2.12/RoadsConditions.jar alaaodeh@52.168.181.252:/home/alaaodeh
