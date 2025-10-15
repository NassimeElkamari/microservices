pipeline {
  agent any

  environment {
    DOCKER_HUB_USER = 'nassimeelkamari'
    REGISTRY = "docker.io/${DOCKER_HUB_USER}"
    // Image names
    IMG_NODE = "${REGISTRY}/microservices-nodejs-task-service:latest"
    IMG_WEB  = "${REGISTRY}/microservices-angular-frontend:latest"
    IMG_SPR  = "${REGISTRY}/microservices-spring-user-service:latest" // reuse only
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

    stage('Build Node.js + Angular (no Spring)') {
      steps {
        echo '📦 Building Node.js + Angular images...'
        bat '''
        docker build -t microservices-nodejs-task-service:latest -f nodejs-task-service\\Dockerfile nodejs-task-service
        docker build -t microservices-angular-frontend:latest -f angular-frontend\\Dockerfile angular-frontend
        '''
      }
    }

    stage('Tag & Push Node.js + Angular') {
      steps {
        echo '☁️ Pushing Node.js + Angular...'
        bat '''
        docker tag microservices-nodejs-task-service:latest %IMG_NODE%
        docker tag microservices-angular-frontend:latest %IMG_WEB%
        docker push %IMG_NODE%
        docker push %IMG_WEB%
        '''
      }
    }

    stage('Deploy to Minikube (Kubernetes)') {
      steps {
        echo '🚀 Applying Kubernetes manifests to Minikube...'
        // Optional: pre-cache images into Minikube node for faster pulls
        bat '''
        minikube status || minikube start --driver=docker
        minikube cache add %IMG_SPR%
        minikube cache add %IMG_NODE%
        minikube cache add %IMG_WEB%
        '''
        // Apply manifests
        bat '''
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

    stage('Smoke Test (optional)') {
      steps {
        echo '🧪 Basic checks...'
        bat '''
        kubectl get pods -o wide
        kubectl get svc angular-frontend
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
