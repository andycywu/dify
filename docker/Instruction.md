mkdir -p ~/.ssh
echo "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQC2vdmds1EX4MoTkMNFkUVbLLEQ5E5ZKc/IH6GLhqU/RTGHI6kMt9cVIUmeZK7bf/ZiUvPCNOpsUI742evoCLM/RSMoifXz8q9BbCugbklQ+UYr0Tq6oD2NpAmMMlWnBh46ALehKdCdmGUfPGRJ3d8x+fTrjm2jnGlbyN+gnNKxKx42TAUry/xO+ls4Ko02jk/oO3p2YiEuZKTULKKMtfaGNP5xcNk3g/Nmc3UbtBd89COjk/K4bd2SFwdpz01m9WfnLDDrI41GENkLZ+nReZ+T7qDjoHiIcD/kfKMAqAq5umVFeUhJOxvo+k3AhGHoohtTyfw7fWiYfEWG7xaphyHVLyo7IBArGRThLVyEax/SKb1HOr2Fpkwnv4GyNh9rhl/vEfYvCeEWqytMLDEhWwHMBYVmKlvdRPZ0G2FAXEUfN8u52bV+z1DDduPY/vjMgOdTp4x0lqwPcwOicc1GbC02+fe0R5a0pnnZbLIKO1b7kZqDeOpn3PNzhrPYHd4MfPla5Zytau/gsrAx3/b5MF/g58z3Mop6vrhChoXHJHlb3yf70fNZwxeTjrmTGicdT8k0SCv30KdmAi1aFWZJbEAcMqfNTPnY2K7hg/tMYrhmzjR2zUmRA39/URyMUhZN2bj96BThBRHRxij46IHfVHz1FRUWYu5y7p9uMKUc8TSuhw== andycy.wu@icloud.com" >> ~/.ssh/authorized_keys
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys


ssh -i ~/.ssh/id_rsa ec2-user@ec2-54-169-166-197.ap-southeast-1.compute.amazonaws.com


ssh -i ~/.ssh/id_rsa ssm-user@54.169.166.197


sudo mkdir -p /home/ec2-user/.ssh
echo "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQC2vdmds1EX4MoTkMNFkUVbLLEQ5E5ZKc/IH6GLhqU/RTGHI6kMt9cVIUmeZK7bf/ZiUvPCNOpsUI742evoCLM/RSMoifXz8q9BbCugbklQ+UYr0Tq6oD2NpAmMMlWnBh46ALehKdCdmGUfPGRJ3d8x+fTrjm2jnGlbyN+gnNKxKx42TAUry/xO+ls4Ko02jk/oO3p2YiEuZKTULKKMtfaGNP5xcNk3g/Nmc3UbtBd89COjk/K4bd2SFwdpz01m9WfnLDDrI41GENkLZ+nReZ+T7qDjoHiIcD/kfKMAqAq5umVFeUhJOxvo+k3AhGHoohtTyfw7fWiYfEWG7xaphyHVLyo7IBArGRThLVyEax/SKb1HOr2Fpkwnv4GyNh9rhl/vEfYvCeEWqytMLDEhWwHMBYVmKlvdRPZ0G2FAXEUfN8u52bV+z1DDduPY/vjMgOdTp4x0lqwPcwOicc1GbC02+fe0R5a0pnnZbLIKO1b7kZqDeOpn3PNzhrPYHd4MfPla5Zytau/gsrAx3/b5MF/g58z3Mop6vrhChoXHJHlb3yf70fNZwxeTjrmTGicdT8k0SCv30KdmAi1aFWZJbEAcMqfNTPnY2K7hg/tMYrhmzjR2zUmRA39/URyMUhZN2bj96BThBRHRxij46IHfVHz1FRUWYu5y7p9uMKUc8TSuhw== andycy.wu@icloud.com" | sudo tee -a /home/ec2-user/.ssh/authorized_keys
sudo chown -R ec2-user:ec2-user /home/ec2-user/.ssh
sudo chmod 700 /home/ec2-user/.ssh
sudo chmod 600 /home/ec2-user/.ssh/authorized_keys