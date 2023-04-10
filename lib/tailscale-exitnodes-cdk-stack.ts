import * as cdk from 'aws-cdk-lib';
import { CloudFormationInit, InitCommand, InitFile, Instance, InstanceType, IpAddresses, MachineImage, OperatingSystemType, SubnetType, UserData, Vpc } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export interface ExitNodeProps extends cdk.StackProps {
  tailscaleAuthKey: string,
  exitNodeName: string
}

export class TailscaleExitnodesCdkStack extends cdk.Stack {

  constructor(scope: Construct, id: string, props: ExitNodeProps) {
    super(scope, id, props);

    // Create a VPC for our node to live in
    const vpc = new Vpc(this, 'TheVPC', {
      ipAddresses: IpAddresses.cidr('10.0.0.0/16'),
      natGateways: 0,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'tailscale',
          subnetType: SubnetType.PUBLIC,
        },
      ]
    })
    
    // Drop our node into the public subnet to keep things simple (and save needing NAT!)
    const publicSubnets = vpc.selectSubnets({
      subnetType: SubnetType.PUBLIC
    });    

    // Get the latest ubuntu 22.04 machine image
    const machineImage = MachineImage.fromSsmParameter(
      '/aws/service/canonical/ubuntu/server/jammy/stable/current/amd64/hvm/ebs-gp2/ami-id',
    );
    
    const userData = UserData.forLinux()
    userData.addCommands(
      // Enable ip forwarding 
      "echo 'net.ipv4.ip_forward = 1' | sudo tee -a /etc/sysctl.conf",
      "echo 'net.ipv6.conf.all.forwarding = 1' | sudo tee -a /etc/sysctl.conf",
      "sysctl -p /etc/sysctl.conf",

      // Install tailscale
      "curl -fsSL https://tailscale.com/install.sh | sh",
      `tailscale up --authkey ${props.tailscaleAuthKey} --advertise-exit-node --hostname=${props.exitNodeName}`
    );

    // Create our exit node
    const instance = new Instance(this, "exitNode", {      
      instanceType: new InstanceType("t3.micro"),
      vpc: vpc,
      instanceName: props.exitNodeName,
      vpcSubnets: publicSubnets,
      machineImage: machineImage,
      // init: CloudFormationInit.fromElements(
      //   InitFile.fromAsset("/tmp/install-tailscale.sh", "install-tailscale.sh", {
      //     mode: '000755' // Make it executable
      //   }),
      //   //InitCommand.argvCommand(['/tmp/install-tailscale.sh', props.tailscaleAuthKey], {}),
      // ),
      userData: userData
    });
  }

}

