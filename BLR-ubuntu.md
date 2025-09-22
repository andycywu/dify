

Please find the OS version, IP address, user name, and password. This username has been added to the sudo file.
 
OS version :
 
root@inblrlxdt020:~# cat /etc/os-release
PRETTY_NAME="Ubuntu 22.04.5 LTS"
 
IP address: 172.27.221.51
 
Login name : obmid
 
This server traffic is going via the Firewall.
 
For this server, SSH is allowed.
 
The password will be sent to you in a separate email.
 
Thank you,
 
Regards,
Lakshma0n

Username: obmid
Password: obmid@123

# 產生金鑰（按 Enter 接受預設路徑）
ssh-keygen -t ed25519 -C "obmid-mac"

# 上傳公鑰（若系統沒有 ssh-copy-id，可用下一段 one-liner）
ssh-copy-id obmid@172.27.221.51

# 若沒有 ssh-copy-id，使用：
cat ~/.ssh/id_ed25519.pub | ssh obmid@172.27.221.51 'mkdir -p ~/.ssh && chmod 700 ~/.shh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys'

# 若你已經有 ~/.ssh/id_ed25519.pub 可直接用：
ssh-copy-id obmid@172.27.221.51

# 若沒有 ssh-copy-id 或想手動：
scp ~/.ssh/id_ed25519.pub obmid@172.27.221.51:/tmp/obmid.pub
ssh obmid@172.27.221.51 'sudo bash -lc "cat /tmp/obmid.pub >> /home/obmid/.ssh/authorized_keys && chown obmid:obmid /home/obmid/.ssh/authorized_keys && chmod 600 /home/obmid/.ssh/authorized_keys && rm -f /tmp/obmid.pub"'


ssh obmid@172.27.221.51
