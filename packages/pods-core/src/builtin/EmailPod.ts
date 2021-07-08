import { Message, SMTPClient } from "emailjs";
import _ from "lodash";
import { PublishPodConfig, PublishPodPlantOpts, PublishPod } from "../basev3";
import { JSONSchemaType } from "ajv";
import { PodUtils } from "../utils";

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

  get config(): JSONSchemaType<EmailPublishConfig> {
    return PodUtils.createPublishConfig({
      required: [],
      properties: {
        from: {
          description: "from address",
          type: "string",
          example: "you <username@outlook.com>",
        },
        to: {
          description: "to address",
          type: "string",
          example:
            "someone <someone@your-email.com>, another <another@your-email.com>",
        },
        user: {
          description: "username",
          type: "string",
          example: "hello@dendron.so",
        },
        password: {
          description: "password",
          type: "string",
          example: "secret123",
        },
        host: {
          description: "host",
          type: "string",
          default: "smtp.gmail.com",
        },
        subject: {
          description: "subject",
          type: "string",
        },
      },
    }) as JSONSchemaType<EmailPublishConfig>;
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
