import { Message, SMTPClient } from "emailjs";
import _ from "lodash";
import { PublishPodConfig, PublishPodPlantOpts, PublishPod } from "../basev3";

const ID = "dendron.email";

type EmailPublishConfig = PublishPodConfig & {
  username: string;
  password: string;
  host: string;
  from: string;
};

export class EmailPublishPod extends PublishPod<EmailPublishConfig> {
  static id: string = ID;
  static description: string = "publish to email";

  get config() {
    return super.config.concat([
      {
        key: "from",
        description: "from address",
        type: "boolean",
        default: false,
        example: "you <username@outlook.com>",
      },
      {
        key: "to",
        description: "to address",
        type: "boolean",
        default: false,
        example:
          "someone <someone@your-email.com>, another <another@your-email.com>",
      },
      {
        key: "user",
        description: "username",
        type: "string",
        default: false,
        example: "hello@dendron.so",
      },
      {
        key: "password",
        description: "password",
        type: "string",
        default: false,
        example: "secret123",
      },
      {
        key: "host",
        description: "host",
        type: "string",
        default: "smtp.gmail.com",
      },
      {
        key: "subject",
        description: "subject",
        type: "string",
      },
    ]);
  }

  async plant(opts: PublishPodPlantOpts) {
    const { note, config } = opts;

    const { user, password, host, from, to, subject } = _.defaults(
      _.get(note.custom, "email", {}),
      config
    );
    const text = note.body;
    console.log("bond");
    console.log(user, password, host);

    const client = new SMTPClient({
      user,
      password,
      host,
      ssl: true,
      tls: true,
    });
    const message = new Message({
      text,
      from,
      to,
      subject,
    });

    // send the message and get a callback with an error or details of the message that was sent
    await client.sendAsync(message);
    return "";
  }
}
