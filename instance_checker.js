const aws = require("aws-sdk");
const ec2 = new aws.EC2({ region : "us-east-1" });
const fs = require('fs')
const SSH2Promise = require('ssh2-promise');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
 
let params = {
    Filters: [{
        Name: 'tag:Name',
        Values: [
            'prod_omnilert_sms_api',
            // enter other instance name tags here
        ],
    }]
};

const instanceIds = [];

// Uncomment to write to a file below
// const log = fs.createWriteStream('YOUR_FILENAME_HERE.txt', { flags: 'a' });

// To describe ALL instances, change this line to this:
// ec2.describeInstances({ }, async (err, data) => { 
ec2.describeInstances(params, async (err, data) => {
    if (err) console.log(err, " error")

    try {
        for (const reservation of data.Reservations) {
            for (const instance of reservation.Instances) {
                instanceIds.push({ ip: instance.PrivateIpAddress, instanceId: instance.InstanceId, name: instance.Tags[0].Value })
            }
        }

        for (const instance of instanceIds) {
            await sleep(100)

            const sshconfig = {
                host: `${instance.ip}`,
                username: '', // Username here, usually ec2-user
                identity: '' // Full path to your .pem here
            }
            
            const ssh = new SSH2Promise(sshconfig);

            await ssh.connect(sshconfig)

            const result = await ssh.exec('ls') // Command you'd like to run on the instance

            // Uncomment this line to write to a file
            // log.write(`Name: ${instance.name}\nPrivateIp: ${instance.ip}\nInstanceID: ${instance.instanceId}\n\n ${result.toString()} \n\n --------------------------------- \n\n`);
            console.log(`Name: ${instance.name}\nPrivateIp: ${instance.ip}\nInstanceID: ${instance.instanceId}\n\n ${result.toString()} \n\n ---------------------------------`)

            await ssh.close()
        }
    } catch(e) {
        console.log(e)
    }
});
