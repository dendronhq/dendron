"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class User {
    constructor(nameOrUser, email, id) {
        if (typeof nameOrUser === "string") {
            this.name = nameOrUser;
            this.email = email || "";
            this.id = id || -1;
        }
        else {
            this.name = nameOrUser.name;
            this.email = nameOrUser.email;
            this.id = nameOrUser.id;
        }
    }
}
exports.default = User;
//# sourceMappingURL=User.js.map