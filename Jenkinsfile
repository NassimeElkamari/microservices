pipeline {
  agent any

  environment {
    DOCKER_HUB_USER = 'nassimeelkamari'
    REGISTRY = "docker.io/${DOCKER_HUB_USER}"

    // Dynamic versioning
    BUILD_TAG = "${env.BUILD_NUMBER}"
    IMG_NODE = "${REGISTRY}/microservices-nodejs-task-service:${BUILD_TAG}"
    IMG_WEB  = "${REGISTRY}/microservices-angular-frontend:${BUILD_TAG}"
    IMG_SPR  = "${REGISTRY}/microservices-spring-user-service:latest"
  }

  stages {
    stage('Checkout') {
      steps {
        echo '📥 Cloning repository...'
        git branch: 'main', url: 'https://github.com/NassimeElkamari/microservices.git'
      }
    }

    stage('Docker Login') {
      steps {
        echo '🔑 Logging in to Docker Hub...'
        withCredentials([usernamePassword(credentialsId: 'dockerHub_cred', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
          bat '''
          echo %DOCKER_PASS% | docker login -u %DOCKER_USER% --password-stdin
          '''
        }
      }
    }

    stage('Build Node.js + Angular Images') {
      steps {
        echo '📦 Building Node.js + Angular images (no cache)...'
        bat '''
        docker build --no-cache -t %IMG_NODE% -f nodejs-task-service\\Dockerfile nodejs-task-service
        docker build --no-cache -t %IMG_WEB% -f angular-frontend\\Dockerfile angular-frontend
        '''
      }
    }

    stage('Push Images to Docker Hub') {
      steps {
        echo '☁️ Pushing Node.js + Angular images...'
        bat '''
        docker push %IMG_NODE%
        docker push %IMG_WEB%
        '''
      }
    }

    stage('Deploy to Minikube') {
      steps {
        echo '🚀 Applying Kubernetes manifests...'
        bat '''
        minikube status || minikube start --driver=docker

        REM ✅ Clear old cache to force new images
        minikube cache delete
        minikube cache add %IMG_SPR%
        minikube cache add %IMG_NODE%
        minikube cache add %IMG_WEB%

        REM ✅ Update YAMLs dynamically (optional if you use latest tag in YAMLs)
        kubectl apply -f k8s\\00-secrets-config.yaml
        kubectl apply -f k8s\\10-mysql.yaml
        kubectl apply -f k8s\\20-spring-user.yaml
        kubectl apply -f k8s\\30-nodejs-task.yaml
        kubectl apply -f k8s\\40-angular-frontend.yaml

        kubectl rollout status deploy/spring-user-service
        kubectl rollout status deploy/nodejs-task-service
        kubectl rollout status deploy/angular-frontend
        '''
      }
    }

    stage('Initialize MySQL Tables') {
      steps {
        echo '🧩 Creating tables and inserting sample data...'
        bat '''
        kubectl exec deploy/mysql -- sh -c "mysql -uroot -p672002 -e \\"CREATE TABLE IF NOT EXISTS tasks (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), description TEXT, user_id INT, status VARCHAR(50) DEFAULT 'pending'); INSERT INTO tasks (title, description, user_id, status) VALUES ('Sample Task', 'Pipeline-created task', 1, 'pending'); CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), email VARCHAR(255)); INSERT IGNORE INTO users (id, name, email) VALUES (1, 'Alice', 'alice@example.com');\\" todo_db"
        '''
      }
    }

    stage('Smoke Test') {
      steps {
        echo '🧪 Checking deployed resources...'
        bat '''
        kubectl get pods -o wide
        kubectl get svc
        '''
      }
    }
  }

  post {
    always {
      echo '✅ Pipeline finished'
      bat 'docker logout'
    }
    failure {
      echo '❌ Pipeline failed!'
    }
  }
}
