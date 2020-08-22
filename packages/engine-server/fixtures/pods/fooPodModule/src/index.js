const { say } = require('cowsay');

class TestPod {
  execute() {
    console.log(say({ text: 'grazing in the browser' }));
  }
}

module.exports = TestPod;
