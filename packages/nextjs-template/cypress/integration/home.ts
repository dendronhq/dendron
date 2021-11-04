/// <reference types="cypress" />.

describe("Index", () => {
  it("successfully loads", () => {
    cy.visit("/");
  });
});

export {}