pipeline {
  agent any

  environment {
    DOCKER_CREDENTIALS = 'dockerHub_cred'          // Jenkins credentials ID
    DOCKER_USER        = 'nassimeelkamari'         // Docker Hub username

    // Image names
    IMG_ANGULAR_LOCAL  = 'microservices-angular-frontend:latest'
    IMG_NODE_LOCAL     = 'microservices-nodejs-task-service:latest'
    IMG_SPRING_LOCAL   = 'microservices-spring-user-service:latest'   // not pushing

    IMG_ANGULAR_HUB    = "docker.io/${DOCKER_USER}/microservices-angular-frontend:latest"
    IMG_NODE_HUB       = "docker.io/${DOCKER_USER}/microservices-nodejs-task-service:latest"
    IMG_SPRING_HUB     = "docker.io/${DOCKER_USER}/microservices-spring-user-service:latest" // already on Hub

    // K8s
    NAMESPACE          = 'microservices'
    K8S_DIR            = 'k8s'
    DEPLOY_ANGULAR     = 'angular-frontend'
    DEPLOY_NODE        = 'nodejs-task-service'
    DEPLOY_SPRING      = 'spring-user-service'
  }

  stages {

    stage('Check Docker Access') {
      steps {
        bat 'whoami'
        bat 'docker ps'
      }
    }

    stage('Checkout') {
      steps {
        git branch: 'main', url: 'https://github.com/NassimeElkamari/microservices.git'
      }
    }

    stage('Build images') {
      steps {
        echo '🛠️ Building local images (compose)'
        bat 'docker-compose build'  // no --no-cache so it reuses layers
        echo '🏷️ Tagging for Docker Hub'
        bat """
          docker tag %IMG_ANGULAR_LOCAL% %IMG_ANGULAR_HUB%
          docker tag %IMG_NODE_LOCAL%    %IMG_NODE_HUB%
          docker tag %IMG_SPRING_LOCAL%  %IMG_SPRING_HUB%
        """
      }
    }

 
    stage('Deploy to Kubernetes') {
      steps {
        echo '⚙️ Apply manifests'
        bat """
          kubectl apply -f %K8S_DIR%/namespace.yaml
          kubectl apply -f %K8S_DIR% -n %NAMESPACE%
        """

        echo '🔁 Point deployments at the Hub images'
        bat """
          kubectl -n %NAMESPACE% set image deployment/%DEPLOY_ANGULAR% %DEPLOY_ANGULAR%=%IMG_ANGULAR_HUB%
          kubectl -n %NAMESPACE% set image deployment/%DEPLOY_NODE%    %DEPLOY_NODE%=%IMG_NODE_HUB%
          kubectl -n %NAMESPACE% set image deployment/%DEPLOY_SPRING%  %DEPLOY_SPRING%=%IMG_SPRING_HUB%
        """

        echo '⏳ Wait for rollout'
        bat """
          kubectl -n %NAMESPACE% rollout status deployment/%DEPLOY_ANGULAR% --timeout=300s
          kubectl -n %NAMESPACE% rollout status deployment/%DEPLOY_NODE%    --timeout=300s
          kubectl -n %NAMESPACE% rollout status deployment/%DEPLOY_SPRING%  --timeout=300s
        """
      }
    }

    stage('Smoke Check') {
      steps {
        bat """
          kubectl -n %NAMESPACE% get deploy,po,svc -o wide
          echo.
          echo Angular URL:
          minikube -p minikube -n %NAMESPACE% service %DEPLOY_ANGULAR% --url
        """
      }
    }
  }

  post {
    success {
      echo '🎉 SUCCESS: Images pushed (A+N) and K8s deployed!'
    }
    failure {
      echo '❌ FAILURE: Check console output.'
      bat 'kubectl -n %NAMESPACE% get events --sort-by=.lastTimestamp || exit 0'
    }
    always {
      echo '📊 Pipeline finished.'
    }
  }
}
