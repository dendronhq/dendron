import { DendronError } from "@dendronhq/common-all";
import { findInParent } from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import nodegit, { Repository } from "nodegit";
import os from "os";
import path from "path";

const DEFAULT_CREDENTIALS = {
  type: "ssh",
  privateKey: path.join(os.homedir(), ".ssh", "id_rsa"),
  publicKey: path.join(os.homedir(), ".ssh", "id_rsa.pub"),
  passphrase: "",
  username: "",
  password: "",
};

export type Credentials = {
  type: "ssh";
  privateKey: string;
  publicKey: string;
  passphrase: string;
  username: string;
  password: string;
};

export function findRepo() {
  const resp = findInParent(".", ".git");
  if (_.isUndefined(resp)) {
    throw Error("no repo found");
  }
  const pathToRepo = path.join(resp, ".git");
  return nodegit.Repository.open(pathToRepo);
}

export async function isRepo(
  fpath: string
): Promise<nodegit.Repository | false> {
  try {
    return await nodegit.Repository.open(fpath);
  } catch (err) {
    return false;
  }
}

// function onCredentialCheck() {
//   // NOTE: you might instead need to get an SSH key from
//   //    local public/private keys, using `sshKeyNew(..)`.
//   //    either way, the username has to be 'git' if that's
//   //    the username used for the SSH URL for the remote
//   //    (clone, etc)
//   return Cred.sshKeyFromAgent("git");
// }

export class Git {
  static isRepo = isRepo;

  public repo: Repository;

  static createCreds(creds: Partial<Credentials>): Credentials {
    return _.defaults(creds, DEFAULT_CREDENTIALS);
  }

  /**
   * generate options for fetch
   *
   * ```
   * credentials: {
   *   type: string,        // 'ssh' or 'http'
   *   privateKey: string,  // path to ssh private key
   *   publicKey: string,   // path to ssh public key
   *   passphrase: string,  // passphrase of credentials
   *   username: string,    // http username
   *   password: string,    // http password
   * }
   * ```
   *
   * @param {Object} credentials
   * @return {Object}
   */
  static fetchOptions(credentials: Credentials) {
    credentials = Object.assign({}, DEFAULT_CREDENTIALS, credentials);

    const callbacks: any = {};
    // if (process.platform === 'darwin') {
    callbacks.certificateCheck = () => 0;
    // }

    // callbacks.credentials = (_url: string, username: string) => {
    //   if (credentials.type === 'ssh') {
    //     console.log(credentials, username);
    //     return Cred.sshKeyNew(
    //       username,
    //       credentials.publicKey,
    //       credentials.privateKey,
    //       credentials.passphrase
    //     )
    //   } else if (credentials.type === 'http') {
    //     return Cred.userpassPlaintextNew(credentials.username, credentials.password)
    //   } else {
    //     return Cred.usernameNew(username)
    //   }
    // }

    return {
      callbacks,
    };
  }

  static async create(fpath: string) {
    const repo = await isRepo(fpath);
    if (!repo) {
      throw new DendronError({ msg: "no repo found" });
    }
    return new Git(repo);
  }

  static async createRepoWithCommit(fpath: string) {
    const repo = await nodegit.Repository.init(fpath, 0);
    await Git.initRepo(repo);
  }

  static async initRepo(repo: Repository) {
    const root = repo.workdir();
    const gitIgnore = path.join(root, ".gitignore");
    fs.writeFileSync(gitIgnore, "", { encoding: "utf8" });
    const idx = await repo.refreshIndex();
    await idx.addAll();
    await idx.write();
    const oid = await idx.writeTree();
    const author = nodegit.Signature.now("dendron", "bot@dendron.so");
    var committer = nodegit.Signature.now("dendron", "bot@dendron.so");
    await repo.createCommit("HEAD", author, committer, "message", oid, []);
  }

  static async getRemotes(repo: Repository) {
    const refs = await repo.getReferences();
    const remoteRefs = refs.filter((r) => r.isRemote() === 1);
    return remoteRefs.map((r) => r.name());
  }

  static async pushRepo(repo: Repository, credentials: Credentials) {
    // console.log("1", repo, credentials);
    // const branch = await repo.getCurrentBranch()
    // if (!branch.isHead()) {
    //   throw new Error(`HEAD is not pointing to current branch ${branch.shorthand()}, cannot pull`)
    // }
    // console.log("2", branch);

    // const upstream = await Branch.upstream(branch);
    // console.log("3", upstream);
    // const remoteName = await Branch.remoteName(repo, upstream.name())
    // console.log("4");
    // console.log({branch, upstream, remoteName, bond: true});
    // const remote = await this.rawRepo.getRemote(remoteName)
    // const remoteBranchName = upstream.shorthand().replace(`${remoteName}/`, '')
    // const refspec = `refs/heads/${branch.shorthand()}:refs/heads/${remoteBranchName}`

    const remote = await repo.getRemote("refs/remotes/origin/master");
    console.log(remote);
    // NOTE: pulling out all refs so that the push is complete
    const refs = await repo.getReferences();
    const refSpecs = refs.map(function getRefSpec(ref) {
      return `${ref.toString()}:${ref.toString()}`;
    });

    // NOTE: this is how to connect/disconnect the remote, in case
    //    that's needed; but it doesn't seem like it is.
    // await remote.connect(Git.Enums.DIRECTION.PUSH,authenticationCallbacks);
    // await remote.disconnect();

    // NOTE: pushing generally requires authentication, so this is
    //    how to do that:
    await remote.push(refSpecs, {
      ...Git.fetchOptions(credentials),
    });
  }

  constructor(repo: Repository) {
    this.repo = repo;
  }
}

export { nodegit };
