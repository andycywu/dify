# Tilt.dev Configuration for Dify
# Additional settings and extensions for better development experience

# Load additional extensions
load('ext://configmap', 'configmap_create')
load('ext://secret', 'secret_create_generic')
load('ext://cert_manager', 'cert_manager_install')

# Function to create development secrets
def create_dev_secrets():
    """Create Kubernetes secrets for development"""
    secret_create_generic(
        'dify-secrets',
        from_env_file='tilt.env',
        namespace='default'
    )

# Function to create configmaps
def create_dev_configmaps():
    """Create Kubernetes configmaps for development"""  
    configmap_create(
        'dify-config',
        from_env_file='tilt.env',
        namespace='default'
    )

# Function to setup development namespace
def setup_dev_namespace():
    """Setup development namespace with proper labels"""
    k8s_yaml("""
apiVersion: v1
kind: Namespace
metadata:
  name: dify-dev
  labels:
    app.kubernetes.io/name: dify
    app.kubernetes.io/component: development
    tilt.dev/managed: "true"
""")

# Function to create persistent volumes for development
def create_dev_volumes():
    """Create persistent volumes for stateful services"""
    k8s_yaml("""
apiVersion: v1
kind: PersistentVolume
metadata:
  name: postgres-pv
  labels:
    type: local
    app: postgres
spec:
  capacity:
    storage: 5Gi
  accessModes:
    - ReadWriteOnce
  hostPath:
    path: "/tmp/dify-postgres-data"
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
  selector:
    matchLabels:
      type: local
      app: postgres
---
apiVersion: v1
kind: PersistentVolume
metadata:
  name: redis-pv
  labels:
    type: local
    app: redis
spec:
  capacity:
    storage: 1Gi
  accessModes:
    - ReadWriteOnce
  hostPath:
    path: "/tmp/dify-redis-data"
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: redis-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
  selector:
    matchLabels:
      type: local
      app: redis
""")

# Custom build function for better caching
def docker_build_cached(image_name, context, dockerfile, **kwargs):
    """Enhanced docker build with better caching"""
    return docker_build(
        image_name,
        context=context,
        dockerfile=dockerfile,
        build_args={
            'BUILDKIT_INLINE_CACHE': '1',
        },
        cache_from=[image_name + ':cache'],
        **kwargs
    )

# Function to setup development tools
def setup_dev_tools():
    """Setup additional development tools"""
    
    # Redis Commander for database management
    k8s_yaml("""
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis-commander
  labels:
    app: redis-commander
spec:
  selector:
    matchLabels:
      app: redis-commander
  template:
    metadata:
      labels:
        app: redis-commander
    spec:
      containers:
      - name: redis-commander
        image: rediscommander/redis-commander:latest
        env:
        - name: REDIS_HOSTS
          value: "redis:redis:6379:0:%s" % REDIS_PASSWORD
        ports:
        - containerPort: 8081
---
apiVersion: v1
kind: Service
metadata:
  name: redis-commander
spec:
  selector:
    app: redis-commander
  ports:
  - port: 8081
    targetPort: 8081
""")
    
    # pgAdmin for PostgreSQL management
    k8s_yaml("""
apiVersion: apps/v1
kind: Deployment
metadata:
  name: pgadmin
  labels:
    app: pgadmin
spec:
  selector:
    matchLabels:
      app: pgadmin
  template:
    metadata:
      labels:
        app: pgadmin
    spec:
      containers:
      - name: pgadmin
        image: dpage/pgadmin4:latest
        env:
        - name: PGADMIN_DEFAULT_EMAIL
          value: "admin@dify.ai"
        - name: PGADMIN_DEFAULT_PASSWORD
          value: "admin"
        - name: PGADMIN_CONFIG_SERVER_MODE
          value: "False"
        ports:
        - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: pgadmin
spec:
  selector:
    app: pgadmin
  ports:
  - port: 5050
    targetPort: 80
""")

# Function to create health check endpoints
def setup_health_checks():
    """Setup comprehensive health checks"""
    k8s_yaml("""
apiVersion: v1
kind: ConfigMap
metadata:
  name: health-check-scripts
data:
  postgres-health.sh: |
    #!/bin/bash
    pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USERNAME -d $DB_DATABASE
  redis-health.sh: |
    #!/bin/bash
    redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD ping
  api-health.sh: |
    #!/bin/bash
    curl -f http://api:5001/health
""")

# Export utility functions for use in main Tiltfile
def get_dev_extensions():
    """Get all development extensions"""
    return {
        'create_secrets': create_dev_secrets,
        'create_configmaps': create_dev_configmaps,
        'setup_namespace': setup_dev_namespace,
        'create_volumes': create_dev_volumes,
        'setup_tools': setup_dev_tools,
        'setup_health_checks': setup_health_checks,
        'docker_build_cached': docker_build_cached,
    }