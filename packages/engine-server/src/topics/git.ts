// import { DendronError } from "@dendronhq/common-all";
// import { findInParent } from "@dendronhq/common-server";
// import fs from "fs-extra";
// import _ from "lodash";
// import nodegit, { Repository } from "nodegit";
// import os from "os";
// import path from "path";
import execa from "execa";
import fs from "fs-extra";
import path from "path";

export class Git {
  static async getRepo(fpath: string): Promise<any | false> {
    return fs.existsSync(path.join(fpath, ".git"));
    // try {
    //   const out = await execa.command(`git status`, {
    //     shell: true,
    //     cwd: fpath,
    //   });
    //   return out;
    //   // return await nodegit.Repository.open(fpath);
    // } catch (err) {
    //   const { stderr } = err as { stderr: string };
    //   if (stderr.match(/not a git repository/)) {
    //     return false;
    //   }
    //   throw err;
    // }
  }

  constructor(public opts: { localUrl: string; remoteUrl: string }) {}

  async isRepo(): Promise<boolean> {
    return Git.getRepo(this.opts.localUrl);
  }

  async clone(destOverride?: string) {
    const { localUrl, remoteUrl } = this.opts;
    const cmdParts = ["git clone", remoteUrl];
    if (destOverride) {
      cmdParts.push(destOverride);
    }
    await execa.command(cmdParts.join(" "), {
      shell: true,
      cwd: localUrl,
    });
    return localUrl;
  }
}

// const DEFAULT_CREDENTIALS = {
//   type: "ssh",
//   privateKey: path.join(os.homedir(), ".ssh", "id_rsa"),
//   publicKey: path.join(os.homedir(), ".ssh", "id_rsa.pub"),
//   passphrase: "",
//   username: "",
//   password: "",
// };

// export type Credentials = {
//   type: "ssh";
//   privateKey: string;
//   publicKey: string;
//   passphrase: string;
//   username: string;
//   password: string;
// };

// export function findRepo() {
//   const resp = findInParent(".", ".git");
//   if (_.isUndefined(resp)) {
//     throw Error("no repo found");
//   }
//   const pathToRepo = path.join(resp, ".git");
//   return nodegit.Repository.open(pathToRepo);
// }

// export async function isRepo(
//   fpath: string
// ): Promise<nodegit.Repository | false> {
//   try {
//     return await nodegit.Repository.open(fpath);
//   } catch (err) {
//     return false;
//   }
// }

// // function onCredentialCheck() {
// //   // NOTE: you might instead need to get an SSH key from
// //   //    local public/private keys, using `sshKeyNew(..)`.
// //   //    either way, the username has to be 'git' if that's
// //   //    the username used for the SSH URL for the remote
// //   //    (clone, etc)
// //   return Cred.sshKeyFromAgent("git");
// // }

// export class Git {
//   static isRepo = isRepo;

//   public repo: Repository;

//   static createCreds(creds: Partial<Credentials>): Credentials {
//     return _.defaults(creds, DEFAULT_CREDENTIALS);
//   }

//   /**
//    * generate options for fetch
//    *
//    * ```
//    * credentials: {
//    *   type: string,        // 'ssh' or 'http'
//    *   privateKey: string,  // path to ssh private key
//    *   publicKey: string,   // path to ssh public key
//    *   passphrase: string,  // passphrase of credentials
//    *   username: string,    // http username
//    *   password: string,    // http password
//    * }
//    * ```
//    *
//    * @param {Object} credentials
//    * @return {Object}
//    */
//   static fetchOptions(credentials: Credentials) {
//     credentials = Object.assign({}, DEFAULT_CREDENTIALS, credentials);

//     const callbacks: any = {};
//     // if (process.platform === 'darwin') {
//     callbacks.certificateCheck = () => 0;
//     // }

//     // callbacks.credentials = (_url: string, username: string) => {
//     //   if (credentials.type === 'ssh') {
//     //     console.log(credentials, username);
//     //     return Cred.sshKeyNew(
//     //       username,
//     //       credentials.publicKey,
//     //       credentials.privateKey,
//     //       credentials.passphrase
//     //     )
//     //   } else if (credentials.type === 'http') {
//     //     return Cred.userpassPlaintextNew(credentials.username, credentials.password)
//     //   } else {
//     //     return Cred.usernameNew(username)
//     //   }
//     // }

//     return {
//       callbacks,
//     };
//   }

//   static async create(fpath: string) {
//     const repo = await isRepo(fpath);
//     if (!repo) {
//       throw new DendronError({ msg: "no repo found" });
//     }
//     return new Git(repo);
//   }

//   static async createRepoWithCommit(fpath: string) {
//     const repo = await nodegit.Repository.init(fpath, 0);
//     await Git.initRepo(repo);
//   }

//   static async initRepo(repo: Repository) {
//     const root = repo.workdir();
//     const gitIgnore = path.join(root, ".gitignore");
//     fs.writeFileSync(gitIgnore, "", { encoding: "utf8" });
//     const idx = await repo.refreshIndex();
//     await idx.addAll();
//     await idx.write();
//     const oid = await idx.writeTree();
//     const author = nodegit.Signature.now("dendron", "bot@dendron.so");
//     var committer = nodegit.Signature.now("dendron", "bot@dendron.so");
//     await repo.createCommit("HEAD", author, committer, "message", oid, []);
//   }

//   constructor(repo: Repository) {
//     this.repo = repo;
//   }
// }

// export { nodegit };
