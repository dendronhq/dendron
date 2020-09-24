import supertest from "supertest";
import { BAD_REQUEST, CREATED, OK } from "http-status-codes";
import { Response, SuperTest, Test } from "supertest";

import app from "@server";
import UserDao from "@daos/User/UserDao.mock";
import User, { IUser } from "@entities/User";
import { pErr } from "@shared/functions";
import { paramMissingError } from "@shared/constants";

describe("Users Routes", () => {
  const usersPath = "/api/users";
  const getUsersPath = `${usersPath}/all`;
  const addUsersPath = `${usersPath}/add`;
  const updateUserPath = `${usersPath}/update`;
  const deleteUserPath = `${usersPath}/delete/:id`;

  let agent: SuperTest<Test>;

  beforeAll((done) => {
    agent = supertest.agent(app);
    done();
  });

  describe(`"GET:${getUsersPath}"`, () => {
    it(`should return a JSON object with all the users and a status code of "${OK}" if the
            request was successful.`, (done) => {
      const users = [
        new User("Sean Maxwell", "sean.maxwell@gmail.com"),
        new User("John Smith", "john.smith@gmail.com"),
        new User("Gordan Freeman", "gordan.freeman@gmail.com"),
      ];

      spyOn(UserDao.prototype, "getAll").and.returnValue(
        Promise.resolve(users)
      );

      agent.get(getUsersPath).end((err: Error, res: Response) => {
        pErr(err);
        expect(res.status).toBe(OK);
        // Caste instance-objects to 'User' objects
        const retUsers = res.body.users.map((user: IUser) => {
          return new User(user);
        });
        expect(retUsers).toEqual(users);
        expect(res.body.error).toBeUndefined();
        done();
      });
    });

    it(`should return a JSON object containing an error message and a status code of
            "${BAD_REQUEST}" if the request was unsuccessful.`, (done) => {
      const errMsg = "Could not fetch users.";
      spyOn(UserDao.prototype, "getAll").and.throwError(errMsg);

      agent.get(getUsersPath).end((err: Error, res: Response) => {
        pErr(err);
        expect(res.status).toBe(BAD_REQUEST);
        expect(res.body.error).toBe(errMsg);
        done();
      });
    });
  });

  describe(`"POST:${addUsersPath}"`, () => {
    const callApi = (reqBody: object) => {
      return agent.post(addUsersPath).type("form").send(reqBody);
    };

    const userData = {
      user: new User("Gordan Freeman", "gordan.freeman@gmail.com"),
    };

    it(`should return a status code of "${CREATED}" if the request was successful.`, (done) => {
      spyOn(UserDao.prototype, "add").and.returnValue(Promise.resolve());

      agent
        .post(addUsersPath)
        .type("form")
        .send(userData) // pick up here
        .end((err: Error, res: Response) => {
          pErr(err);
          expect(res.status).toBe(CREATED);
          expect(res.body.error).toBeUndefined();
          done();
        });
    });

    it(`should return a JSON object with an error message of "${paramMissingError}" and a status
            code of "${BAD_REQUEST}" if the user param was missing.`, (done) => {
      callApi({}).end((err: Error, res: Response) => {
        pErr(err);
        expect(res.status).toBe(BAD_REQUEST);
        expect(res.body.error).toBe(paramMissingError);
        done();
      });
    });

    it(`should return a JSON object with an error message and a status code of "${BAD_REQUEST}"
            if the request was unsuccessful.`, (done) => {
      const errMsg = "Could not add user.";
      spyOn(UserDao.prototype, "add").and.throwError(errMsg);

      callApi(userData).end((err: Error, res: Response) => {
        pErr(err);
        expect(res.status).toBe(BAD_REQUEST);
        expect(res.body.error).toBe(errMsg);
        done();
      });
    });
  });

  describe(`"PUT:${updateUserPath}"`, () => {
    const callApi = (reqBody: object) => {
      return agent.put(updateUserPath).type("form").send(reqBody);
    };

    const userData = {
      user: new User("Gordan Freeman", "gordan.freeman@gmail.com"),
    };

    it(`should return a status code of "${OK}" if the request was successful.`, (done) => {
      spyOn(UserDao.prototype, "update").and.returnValue(Promise.resolve());

      callApi(userData).end((err: Error, res: Response) => {
        pErr(err);
        expect(res.status).toBe(OK);
        expect(res.body.error).toBeUndefined();
        done();
      });
    });

    it(`should return a JSON object with an error message of "${paramMissingError}" and a
            status code of "${BAD_REQUEST}" if the user param was missing.`, (done) => {
      callApi({}).end((err: Error, res: Response) => {
        pErr(err);
        expect(res.status).toBe(BAD_REQUEST);
        expect(res.body.error).toBe(paramMissingError);
        done();
      });
    });

    it(`should return a JSON object with an error message and a status code of "${BAD_REQUEST}"
            if the request was unsuccessful.`, (done) => {
      const updateErrMsg = "Could not update user.";
      spyOn(UserDao.prototype, "update").and.throwError(updateErrMsg);

      callApi(userData).end((err: Error, res: Response) => {
        pErr(err);
        expect(res.status).toBe(BAD_REQUEST);
        expect(res.body.error).toBe(updateErrMsg);
        done();
      });
    });
  });

  describe(`"DELETE:${deleteUserPath}"`, () => {
    const callApi = (id: number) => {
      return agent.delete(deleteUserPath.replace(":id", id.toString()));
    };

    it(`should return a status code of "${OK}" if the request was successful.`, (done) => {
      spyOn(UserDao.prototype, "delete").and.returnValue(Promise.resolve());

      callApi(5).end((err: Error, res: Response) => {
        pErr(err);
        expect(res.status).toBe(OK);
        expect(res.body.error).toBeUndefined();
        done();
      });
    });

    it(`should return a JSON object with an error message and a status code of "${BAD_REQUEST}"
            if the request was unsuccessful.`, (done) => {
      const deleteErrMsg = "Could not delete user.";
      spyOn(UserDao.prototype, "delete").and.throwError(deleteErrMsg);

      callApi(1).end((err: Error, res: Response) => {
        pErr(err);
        expect(res.status).toBe(BAD_REQUEST);
        expect(res.body.error).toBe(deleteErrMsg);
        done();
      });
    });
  });
});
