# Tiltfile for Dify Multi-Container Development Environment
# Simplified version that works with existing Docker Compose setup

# Load environment configurations
config.define_string("profile", args=True, usage="Development profile to use (middleware|full)")

cfg = config.parse()
profile = cfg.get("profile", "middleware")

# Handle parameter parsing from command line 
# If profile contains =, extract the value after =
if "=" in profile:
    profile = profile.split("=")[1]

# If middleware is the default, also accept "default" as middleware
if profile == "default":
    profile = "middleware"

# Debug: print the final profile value
print("🔍 Debug: final profile value = '%s'" % profile)

# Map default to middleware for convenience
if profile == "default":
    profile = "middleware"

print("🚀 Starting Dify with Tilt.dev")
print("📋 Profile: %s" % profile)

# =============================================================================
# USE EXISTING DOCKER COMPOSE FILES WITH PROPER SERVICE NAMES
# =============================================================================

if profile == "middleware":
    print("🔧 Loading middleware services (DB, Redis, Weaviate, etc.)")
    
    # Use middleware compose file
    docker_compose('./docker/docker-compose.middleware.yaml')
    
    # Configure resources with proper labels and dependencies
    dc_resource('db', labels=['infrastructure'])  
    dc_resource('redis', labels=['infrastructure'])
    dc_resource('plugin_daemon', labels=['infrastructure'])
    dc_resource('sandbox', labels=['infrastructure'])
    dc_resource('ssrf_proxy', labels=['infrastructure'])

elif profile == "full":
    print("🚀 Loading full application stack")
    
    # Use full compose file
    docker_compose('./docker/docker-compose.yaml')
    
    # Infrastructure services
    dc_resource('db', labels=['infrastructure'])
    dc_resource('redis', labels=['infrastructure'])
    dc_resource('plugin_daemon', labels=['infrastructure'])
    dc_resource('ssrf_proxy', labels=['infrastructure'])
    
    # Application services  
    dc_resource('api', labels=['application'])
    dc_resource('worker', labels=['application'])
    dc_resource('worker_beat', labels=['application'])  # Note: underscore not hyphen
    
    # Frontend services
    dc_resource('web', labels=['frontend'])
    dc_resource('dify-next-frontend', labels=['frontend'])
    
    # Additional services
    dc_resource('wiki', labels=['additional'])
    dc_resource('wiki-db-init', labels=['additional'])
    dc_resource('wiki-batch-importer', labels=['additional'])
    dc_resource('rest-to-soap-proxy', labels=['additional'])

print("✅ Tilt configuration loaded successfully!")
print("📊 Tilt Dashboard: http://localhost:10350")
print("🗄️  Database (PostgreSQL): localhost:5432")  
print("🔄 Redis Cache: localhost:6379")
print("🧠 Weaviate Vector DB: http://localhost:8080")

if profile == "full":
    print("🔗 Dify API: http://localhost:5001")
    print("🌐 Dify Web UI: http://localhost:3000")
    print("🆕 Next Frontend: http://localhost:3001")
    print("📚 Wiki.js: http://localhost:3002")
    print("🔌 Plugin Daemon: http://localhost:5002")

