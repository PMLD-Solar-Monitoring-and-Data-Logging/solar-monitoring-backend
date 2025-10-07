# Solar System Monitoring and Data Logging Dashboard

Proyek Mandiri Lintas Disiplin Ilmu (PMLDI)

This project is a web-based dashboard application designed to monitor and log data from a solar power system.

## Features
- Real-time monitoring of solar panel performance
- Data logging and visualization
- Log export functionality

## Technologies Used
- Frontend: Nuxt.js, Tailwind CSS, Flowbite
- Backend: ThingsBoard (Open-source IoT platform)
- Database: PostgreSQL
- Containerization: Docker, Docker Compose
- Version Control: Git, GitHub

## Configuration

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/your-repo.git
   ```

2. Navigate to the project directory:
   ```bash
   cd your-repo
   ```

3. Create a `.env` file in the root directory and configure the following environment variables:
   ```env
   NODE_ENV=production

   # thingsboard config
   TB_BASE_URL=http://localhost:8080/api/v1
   TB_ACCESS_TOKEN=your_access_token
   ```

4. Initialize database
    ```bash
    docker-compose up -d postgres
    docker compose run --rm -e INSTALL_TB=true -e LOAD_DEMO=true thingsboard-ce
    ```

5. Start the application:
   ```bash
   docker-compose up -d
   ```

6. Access the ThingsBoard UI at `http://localhost:8080`

    Default credentials:
    - System Administrator `sysadmin@thingsboard.org / sysadmin`
    - Tenant Administrator `tenant@thingsboard.org / tenant`
    - Customer User `customer@thingsboard.org / customer`

7. Access the Nuxt.js frontend at `http://localhost:3000`
