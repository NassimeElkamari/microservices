pipeline {
  agent any

  environment {
    DOCKER_COMPOSE_FILE = 'docker-compose.yml'
    K8S_DIR    = 'k8s'
    NAMESPACE  = 'microservices'

    // Local images built by docker-compose (must match your k8s manifests)
    LOCAL_ANGULAR = 'microservices-angular-frontend:latest'
    LOCAL_NODE    = 'microservices-nodejs-task-service:latest'
    LOCAL_SPRING  = 'microservices-spring-user-service:latest'
  }

  options {
    timeout(time: 45, unit: 'MINUTES')
    timestamps()
  }

  stages {
    stage('Checkout') {
      steps {
        echo '📥 Cloning repository...'
        git branch: 'main', url: 'https://github.com/NassimeElkamari/microservices.git'
      }
    }

    stage('Prepare Minikube') {
      steps {
        echo '🚜 Ensuring Minikube is running...'
        bat '''
          minikube status || minikube start --driver=docker
          kubectl config current-context
        '''
      }
    }

    stage('Build Images (local)') {
      steps {
        echo '📦 Building Docker images with docker-compose...'
        // no --no-cache, so Maven/npm layers are reused
        bat 'docker-compose -f %DOCKER_COMPOSE_FILE% build'
      }
    }

    stage('Load images into Minikube') {
      steps {
        echo '🚚 Loading images into Minikube (no Docker Hub push)...'
        bat """
          minikube image load %LOCAL_ANGULAR%
          minikube image load %LOCAL_NODE%
          minikube image load %LOCAL_SPRING%
        """
        echo 'ℹ️ Ensure your k8s Deployments use these names and imagePullPolicy: IfNotPresent.'
      }
    }

    stage('Deploy to Kubernetes') {
      steps {
        echo '⚙️ Applying Kubernetes manifests...'
        bat """
          kubectl apply -f %K8S_DIR%/namespace.yaml
          kubectl apply -f %K8S_DIR% -n %NAMESPACE%
        """
      }
    }

    stage('Wait for Rollouts') {
      steps {
        echo '⏳ Waiting for rollouts (give pods time to start)...'
        powershell '''
          $ErrorActionPreference = "Continue"
          try { kubectl rollout status deployment/mysql-db            -n microservices --timeout=300s } catch {}
          try { kubectl rollout status deployment/nodejs-task-service -n microservices --timeout=300s } catch {}
          try { kubectl rollout status deployment/spring-user-service -n microservices --timeout=300s } catch {}
          try { kubectl rollout status deployment/angular-frontend    -n microservices --timeout=300s } catch {}
        '''
      }
    }

    stage('Scale') {
      steps {
        echo '📈 Scaling deployments...'
        bat """
          kubectl scale deployment nodejs-task-service -n %NAMESPACE% --replicas=2
          kubectl scale deployment spring-user-service -n %NAMESPACE% --replicas=2
          kubectl scale deployment angular-frontend    -n %NAMESPACE% --replicas=1
        """
      }
    }

    stage('Smoke Check') {
      steps {
        echo '🔍 Verifying resources & printing service URL...'
        bat """
          kubectl get deploy,po,svc -n %NAMESPACE%
          echo.
          echo Angular service URL:
          minikube -p minikube -n %NAMESPACE% service angular-frontend --url
        """
      }
    }
  }

  post {
    failure {
      echo '❌ Pipeline failed — dumping recent events:'
      bat 'kubectl -n %NAMESPACE% get events --sort-by=.lastTimestamp || exit 0'
      bat 'kubectl -n %NAMESPACE% get deploy,po,svc -o wide || exit 0'
    }
    always {
      echo '✅ Pipeline finished'
    }
  }
}
