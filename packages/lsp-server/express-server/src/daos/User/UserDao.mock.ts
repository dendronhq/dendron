import { IUser } from "@entities/User";
import { getRandomInt } from "@shared/functions";
import { MockDaoMock } from "../MockDb/MockDao.mock";
import { IUserDao } from "./UserDao";

class UserDao extends MockDaoMock implements IUserDao {
  public async getOne(email: string): Promise<IUser | null> {
    try {
      const db = await super.openDb();
      for (const user of db.users) {
        if (user.email === email) {
          return user;
        }
      }
      return null;
    } catch (err) {
      throw err;
    }
  }

  public async getAll(): Promise<IUser[]> {
    try {
      const db = await super.openDb();
      return db.users;
    } catch (err) {
      throw err;
    }
  }

  public async add(user: IUser): Promise<void> {
    try {
      const db = await super.openDb();
      user.id = getRandomInt();
      db.users.push(user);
      await super.saveDb(db);
    } catch (err) {
      throw err;
    }
  }

  public async update(user: IUser): Promise<void> {
    try {
      const db = await super.openDb();
      for (let i = 0; i < db.users.length; i++) {
        if (db.users[i].id === user.id) {
          db.users[i] = user;
          await super.saveDb(db);
          return;
        }
      }
      throw new Error("User not found");
    } catch (err) {
      throw err;
    }
  }

  public async delete(id: number): Promise<void> {
    try {
      const db = await super.openDb();
      for (let i = 0; i < db.users.length; i++) {
        if (db.users[i].id === id) {
          db.users.splice(i, 1);
          await super.saveDb(db);
          return;
        }
      }
      throw new Error("User not found");
    } catch (err) {
      throw err;
    }
  }
}

export default UserDao;
