pipeline {
  agent any

  environment {
    DOCKER_COMPOSE_FILE = 'docker-compose.yml'
    K8S_DIR    = 'k8s'
    NAMESPACE  = 'microservices'

    // Local images built by docker-compose
    LOCAL_ANGULAR = 'microservices-angular-frontend:latest'
    LOCAL_NODE    = 'microservices-nodejs-task-service:latest'
    LOCAL_SPRING  = 'microservices-spring-user-service:latest'

    // Docker Hub repo paths (Spring image already exists on Hub; we won't push it)
    DOCKER_HUB_USER = 'nassimeelkamari'
    HUB_ANGULAR = "docker.io/${DOCKER_HUB_USER}/microservices-angular-frontend:latest"
    HUB_NODE    = "docker.io/${DOCKER_HUB_USER}/microservices-nodejs-task-service:latest"
    HUB_SPRING  = "docker.io/${DOCKER_HUB_USER}/microservices-spring-user-service:latest"
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

    stage('Build Images') {
      steps {
        echo '📦 Building Docker images with docker-compose...'
        bat 'docker-compose -f %DOCKER_COMPOSE_FILE% build'
        echo '🏷️ Tagging images for Docker Hub...'
        bat """
          docker tag %LOCAL_ANGULAR% %HUB_ANGULAR%
          docker tag %LOCAL_NODE%    %HUB_NODE%
          docker tag %LOCAL_SPRING%  %HUB_SPRING%
        """
      }
    }

    stage('Docker Hub Login & Push (Angular + Node only, fallback to Minikube)') {
      steps {
        script {
          def pushed = false
          try {
            withCredentials([usernamePassword(credentialsId: 'dockerHub_cred', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
              powershell '''
                $ErrorActionPreference = "Stop"
                docker logout | Out-Null
                $env:DOCKER_PASS | docker login --username $env:DOCKER_USER --password-stdin
              '''
              retry(2) { bat "docker push %HUB_ANGULAR%" }
              retry(2) { bat "docker push %HUB_NODE%" }
              echo '⏭️ Skipping Spring push (using existing image on Docker Hub).'
              pushed = true
            }
          } catch (e) {
            echo "⚠️ Docker Hub push unavailable (${e}). Falling back to Minikube-loaded images for Angular & Node."
          }
          if (!pushed) {
            bat """
              minikube image load %LOCAL_ANGULAR%
              minikube image load %LOCAL_NODE%
            """
          }
        }
      }
    }

    stage('Deploy to Kubernetes') {
      steps {
        echo '⚙️ Applying Kubernetes manifests...'
        bat """
          kubectl apply -f %K8S_DIR%/namespace.yaml
          kubectl apply -f %K8S_DIR% -n %NAMESPACE%
        """
        echo '⏳ Waiting for rollouts (give pods time to come up)...'
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
