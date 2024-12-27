# Redis configuration
broker_url = "redis://localhost:6379/0"
result_backend = "redis://localhost:6379/1"

# Timezone and schedules
timezone = "Asia/Kolkata"
enable_utc = True  # If you want to enable UTC timing (adjust based on your preference)

# Task settings
task_serializer = 'json'
result_serializer = 'json'
accept_content = ['json']  # Restrict the accepted content types to JSON
task_track_started = True
task_time_limit = 300  # Timeout for tasks (in seconds)

# Retry policy
broker_connection_retry_on_startup = True
task_acks_late = True  # Tasks will be acknowledged after completion
