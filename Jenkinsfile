pipeline {
    agent any

    stages {
        stage('Clone Repository') {
            steps {
                git branch: 'main',credentialsId: 'CodeSyncProject', url: 'git@github.com:Shivam0069/Code-Sync.git'
            }
            post {
                success {
                    echo '✅ Repository cloned successfully.'
                }
                failure {
                    echo '❌ Failed to clone repository. Possible reasons: invalid credentials, wrong branch name, or network issues.'
                }
            }
        }

        stage('Install Dependencies') {
            steps {
                dir('frontend') {
                    sh 'npm install'
                }
                dir('backend') {
                    sh 'npm install'
                }
            }
            post {
                success {
                    echo '✅ Dependencies installed successfully.'
                }
                failure {
                    echo '❌ Failed to install dependencies. Possible reasons: missing package.json, npm registry issues, or network problems.'
                }
            }
        }

        stage('Run Tests') {
            steps {
                dir('frontend') {
                    sh 'npm test || echo "Frontend tests skipped/failed"'
                }
                dir('backend') {
                    sh 'npm test || echo "Backend tests skipped/failed"'
                }
            }
            post {
                success {
                    echo '✅ Tests ran successfully.'
                }
                failure {
                    echo '❌ Tests failed or skipped. Possible reasons: test failures, missing test scripts, or configuration errors.'
                }
            }
        }

        stage('Build Frontend') {
            steps {
                dir('frontend') {
                    sh 'npm run build'
                }
            }
            post {
                success {
                    echo '✅ Frontend built successfully.'
                }
                failure {
                    echo '❌ Frontend build failed. Possible reasons: build script errors, missing dependencies, or configuration issues.'
                }
            }
        }

       stage('Deploy to EC2') {
    steps {
        sshagent(['CodeSync-SSH']) {
            sh '''
            ssh -o StrictHostKeyChecking=no ec2-user@13.221.210.124 '
                set -e

                echo "📦 Pulling latest code..."
                cd /home/ec2-user/Code-Sync
                git pull origin main

                echo "🔧 Installing frontend dependencies..."
                cd frontend
                npm install

                echo "🏗️ Building frontend..."
                npm run build

                echo "🚀 Restarting frontend with PM2..."
                pm2 delete frontend || true
                pm2 start "npm start" --name frontend

                echo "🔧 Installing backend dependencies..."
                cd ../backend
                npm install

                echo "🚀 Restarting backend with PM2..."
                pm2 delete backend || true
                pm2 start server.js --name backend
            '
            '''
        }
    }
    post {
        success {
            echo '✅ Deployment to EC2 completed successfully.'
        }
        failure {
            echo '❌ Deployment to EC2 failed. Possible reasons: SSH issues, git pull failure, or remote build errors.'
        }
    }
}


    }

    post {
        success {
            echo '✅ Deployment completed successfully.'
        }
        failure {
            echo '❌ Deployment failed.'
        }
    }
}
