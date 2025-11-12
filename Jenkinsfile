pipeline {
  agent any

  options {
    timestamps()
    timeout(time: 45, unit: 'MINUTES') // hard cap so it never runs for hours
  }

  environment {
    DOCKER_HUB_USER = 'nassimeelkamari'
    REGISTRY        = "docker.io/${DOCKER_HUB_USER}"
    BUILD_TAG       = "${env.BUILD_NUMBER}"
    IMG_NODE        = "${REGISTRY}/microservices-nodejs-task-service:${BUILD_TAG}"
    IMG_WEB         = "${REGISTRY}/microservices-angular-frontend:${BUILD_TAG}"
    IMG_SPR         = "${REGISTRY}/microservices-spring-user-service:latest"
    DOCKER_BUILDKIT = '1'  // BuildKit = faster builds
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

    stage('Build Images (parallel, cached)') {
      parallel {
        stage('Build Node.js Task') {
          steps {
            bat '''
            docker build ^
              -t %IMG_NODE% ^
              -f nodejs-task-service\\Dockerfile ^
              nodejs-task-service
            '''
          }
        }
        stage('Build Angular Frontend') {
          steps {
            bat '''
            docker build ^
              -t %IMG_WEB% ^
              -f angular-frontend\\Dockerfile ^
              angular-frontend
            '''
          }
        }
      }
    }

    stage('Push Images (parallel)') {
      parallel {
        stage('Push Node') {
          steps { bat 'docker push %IMG_NODE%' }
        }
        stage('Push Angular') {
          steps { bat 'docker push %IMG_WEB%' }
        }
      }
    }

    stage('Prepare Cluster') {
      steps {
        bat '''
        REM Start minikube if needed
        minikube status || minikube start --driver=docker

        REM Preload images into minikube to avoid pulling from Docker Hub
        minikube image load %IMG_NODE%
        minikube image load %IMG_WEB%
        '''
      }
    }

    stage('Deploy App to Minikube') {
      steps {
        bat '''
        kubectl apply -f k8s\\00-secrets-config.yaml
        kubectl apply -f k8s\\10-mysql.yaml
        kubectl apply -f k8s\\20-spring-user.yaml
        kubectl apply -f k8s\\30-nodejs-task.yaml
        kubectl apply -f k8s\\40-angular-frontend.yaml

        kubectl set image deploy/nodejs-task-service nodejs-task-service=%IMG_NODE% --record
        kubectl set image deploy/angular-frontend   angular-frontend=%IMG_WEB% --record

        kubectl rollout status deploy/spring-user-service     
        kubectl rollout status deploy/nodejs-task-service    
        kubectl rollout status deploy/angular-frontend        
        '''
      }
    }

    stage('Deploy Monitoring Stack (only if changed)') {
      when {
        changeset "**/k8s/monitoring/**"
      }
      steps {
        bat '''
        kubectl get ns monitoring || kubectl create namespace monitoring

        kubectl apply -n monitoring -f k8s\\monitoring\\prometheus-config.yaml
        kubectl apply -n monitoring -f k8s\\monitoring\\prometheus-rules.yaml
        kubectl apply -n monitoring -f k8s\\monitoring\\prometheus-deploy.yaml
        kubectl apply -n monitoring -f k8s\\monitoring\\blackbox-exporter.yaml
        kubectl apply -n monitoring -f k8s\\monitoring\\grafana-deploy.yaml
        kubectl apply -n monitoring -f k8s\\monitoring\\alertmanager-config.yaml
        kubectl apply -n monitoring -f k8s\\monitoring\\alertmanager-deploy.yaml

        kubectl rollout status deploy/prometheus         -n monitoring 
        kubectl rollout status deploy/grafana            -n monitoring
        kubectl rollout status deploy/alertmanager       -n monitoring
        kubectl rollout status deploy/blackbox-exporter  -n monitoring
        '''
      }
    }

    stage('Init MySQL Tables (fast & safe)') {
      steps {
        bat '''
        kubectl wait --for=condition=available deploy/mysql --timeout=120s
        kubectl exec deploy/mysql -- sh -c "mysql -uroot -p672002 -e \\"CREATE DATABASE IF NOT EXISTS todo_db; USE todo_db; CREATE TABLE IF NOT EXISTS tasks (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), description TEXT, user_id INT, status VARCHAR(50) DEFAULT 'pending'); INSERT INTO tasks (title, description, user_id, status) VALUES ('Sample Task', 'Pipeline-created task', 1, 'pending'); CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), email VARCHAR(255)); INSERT IGNORE INTO users (id, name, email) VALUES (1, 'Alice', 'alice@example.com');\\""
        '''
      }
    }


    stage('Smoke Test') {
      steps {
        bat '''
        kubectl get pods -o wide
        kubectl get svc
        kubectl get pods -n monitoring
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
