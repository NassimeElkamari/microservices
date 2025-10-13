This directory contains Kubernetes manifests for the microservices demo.

How the Jenkins pipeline uses these:
- The Jenkinsfile builds images locally using `docker-compose`.
- It then uses `minikube image load <image>` to push the local images into Minikube.
- Finally it applies these manifests into the `microservices` namespace.

Files:
- `namespace.yaml` - creates the `microservices` namespace.
- `mysql-deployment.yaml` - PVC + Deployment + Service for MySQL (mysql:8).
- `nodejs-deployment.yaml` - Deployment + Service for the Node.js task service.
- `spring-deployment.yaml` - Deployment + Service for the Spring Boot user service.
- `angular-deployment.yaml` - Deployment + Service for the Angular frontend.

Notes:
- The manifests expect the images named in the repo (`microservices-*-service:latest`) to be available in the cluster. The Jenkins pipeline loads them into Minikube.
- If you prefer exposing the frontend, you can change `angular-frontend` Service type to `NodePort` or create an Ingress and enable Minikube ingress addon.
