import { IUser } from "@entities/User";

export interface IUserDao {
  getOne: (email: string) => Promise<IUser | null>;
  getAll: () => Promise<IUser[]>;
  add: (user: IUser) => Promise<void>;
  update: (user: IUser) => Promise<void>;
  delete: (id: number) => Promise<void>;
}

class UserDao implements IUserDao {
  /**
   * @param email
   */
  public async getOne(email: string): Promise<IUser | null> {
    // TODO
    return [] as any;
  }

  /**
   *
   */
  public async getAll(): Promise<IUser[]> {
    // TODO
    return [] as any;
  }

  /**
   *
   * @param user
   */
  public async add(user: IUser): Promise<void> {
    // TODO
    return {} as any;
  }

  /**
   *
   * @param user
   */
  public async update(user: IUser): Promise<void> {
    // TODO
    return {} as any;
  }

  /**
   *
   * @param id
   */
  public async delete(id: number): Promise<void> {
    // TODO
    return {} as any;
  }
}

export default UserDao;
