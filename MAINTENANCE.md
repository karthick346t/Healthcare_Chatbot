# 🛠️ AWS Instance Maintenance & Cost Guide

Now that your chatbot is live, here is how to manage it without spending too much money.

---

## 💰 How to Save Money (Stop/Start)

AWS charges you per hour for the **t3.large** instance while it is running. To save money when not using it:

### 1. Stopping the Instance
1. Go to **AWS Console** > **Instances**.
2. Select your instance.
3. Click **Instance state** > **Stop instance**.
   > [!WARNING]
   > Do **NOT** click "Terminate". Terminate will delete your server and all your work forever. "Stop" is like turning off a computer.

### 2. What happens to my data?
* Your files, MongoDB data, and RAG embeddings are **safe**.
* You will still pay a very small amount (approx $2-$4/month) for the **Disk Storage (EBS)** even when the instance is stopped.

---

## 🔄 Restarting the Application

When you click **Start instance** again, two things happen:

### 1. The IP Address Changes
Because you don't have an "Elastic IP", your Public IP will be different every time you restart.
* **Good news:** My recent fix to `chatApi.ts` used **Relative Paths** (`""`).
* **Result:** You don't need to change any code! Just open the **New IP:4000** in your browser and it will work automatically.

### 2. Starting the Code
When the server turns on, you need to restart the backend. If you ran the `pm2 startup` command earlier, it might happen automatically. If not, just run:
```bash
cd Healthcare_Chatbot/backend
pm2 restart healthcare-bot
```

---

## 📋 Status Checks
If the website doesn't load after a restart, run these:
```bash
# Check if PM2 is running
pm2 status

# Check if MongoDB is running
sudo systemctl status mongod

# Start MongoDB if it's down
sudo systemctl start mongod
```
