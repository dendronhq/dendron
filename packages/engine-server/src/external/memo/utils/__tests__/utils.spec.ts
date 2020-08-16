import { replaceRefs } from "../utils";

describe("replaceRefs()", () => {
  it("should return null if nothing to replace", async () => {
    expect(
      replaceRefs({
        refs: [{ old: "test-ref", new: "new-test-ref" }],
        content: "[[some-ref]]",
      })
    ).toBe(null);
  });

  it.only("should replace short ref with short ref", async () => {
    expect(
      replaceRefs({
        refs: [{ old: "test-ref", new: "new-test-ref" }],
        content: "[[test-ref]]",
        //content: "[[test-ref]] this is some text  `[[test-ref-in-span]] this is an inline span`\n```\n[[test-ref-in-fence]] this is a code fence\n```\n",
      })
    ).toBe("[[new-test-ref]]");
  });

  it("should replace short ref with label with short ref with label", async () => {
    expect(
      replaceRefs({
        refs: [{ old: "test-ref", new: "new-test-ref" }],
        content: "[[Test Label|test-ref]]",
      })
    ).toBe("[[Test Label|new-test-ref]]");
  });

  // it('should replace long ref with long ref', async () => {
  //   expect(
  //     replaceRefs({
  //       refs: [{ old: 'folder1/test-ref', new: 'folder1/new-test-ref' }],
  //       document: await workspace.openTextDocument({
  //         language: 'markdown',
  //         content: '[[folder1/test-ref]]',
  //       }),
  //     }),
  //   ).toBe('[[folder1/new-test-ref]]');
  // });

  // it('should replace long ref with long ref', async () => {
  //   expect(
  //     replaceRefs({
  //       refs: [{ old: 'folder1/test-ref', new: 'folder1/new-test-ref' }],
  //       document: await workspace.openTextDocument({
  //         language: 'markdown',
  //         content: '[[folder1/test-ref]]',
  //       }),
  //     }),
  //   ).toBe('[[folder1/new-test-ref]]');
  // });

  // it('should replace long ref + label with long ref + label', async () => {
  //   expect(
  //     replaceRefs({
  //       refs: [{ old: 'folder1/test-ref', new: 'folder1/new-test-ref' }],
  //       document: await workspace.openTextDocument({
  //         language: 'markdown',
  //         content: '[[folder1/test-ref|Test Label]]',
  //       }),
  //     }),
  //   ).toBe('[[folder1/new-test-ref|Test Label]]');
  // });

  // it('should replace long ref + label with short ref + label', async () => {
  //   expect(
  //     replaceRefs({
  //       refs: [{ old: 'folder1/test-ref', new: 'new-test-ref' }],
  //       document: await workspace.openTextDocument({
  //         language: 'markdown',
  //         content: '[[folder1/test-ref|Test Label]]',
  //       }),
  //     }),
  //   ).toBe('[[new-test-ref|Test Label]]');
  // });

  // it('should replace short ref + label with long ref + label', async () => {
  //   expect(
  //     replaceRefs({
  //       refs: [{ old: 'test-ref', new: 'folder1/new-test-ref' }],
  //       document: await workspace.openTextDocument({
  //         language: 'markdown',
  //         content: '[[test-ref|Test Label]]',
  //       }),
  //     }),
  //   ).toBe('[[folder1/new-test-ref|Test Label]]');
  // });

  // it('should replace short ref with short ref with unknown extension', async () => {
  //   expect(
  //     replaceRefs({
  //       refs: [{ old: 'test-ref', new: 'new-test-ref.unknown' }],
  //       document: await workspace.openTextDocument({
  //         language: 'markdown',
  //         content: '[[test-ref]]',
  //       }),
  //     }),
  //   ).toBe('[[new-test-ref.unknown]]');
  // });

  // it('should replace short ref with unknown extension with short ref ', async () => {
  //   expect(
  //     replaceRefs({
  //       refs: [{ old: 'test-ref.unknown', new: 'new-test-ref' }],
  //       document: await workspace.openTextDocument({
  //         language: 'markdown',
  //         content: '[[test-ref.unknown]]',
  //       }),
  //     }),
  //   ).toBe('[[new-test-ref]]');
  // });

  // it('should replace long ref with short ref with unknown extension', async () => {
  //   expect(
  //     replaceRefs({
  //       refs: [{ old: 'folder1/test-ref', new: 'new-test-ref.unknown' }],
  //         content: '[[folder1/test-ref]]',
  //       }),
  //     }),
  //   ).toBe('[[new-test-ref.unknown]]');
  // });

  // it('should replace long ref with unknown extension with short ref ', async () => {
  //   expect(
  //     replaceRefs({
  //       refs: [{ old: 'folder1/test-ref.unknown', new: 'new-test-ref' }],
  //         content: '[[folder1/test-ref.unknown]]',
  //       }),
  //     }),
  //   ).toBe('[[new-test-ref]]');
  // });

  it("should not replace ref within code span", async () => {
    expect(
      replaceRefs({
        refs: [{ old: "test-ref", new: "new-test-ref" }],
        content: "`[[test-ref]]`",
      })
    ).toBe("`[[test-ref]]`");
  });

  // it('should not replace ref within code span 2', async () => {
  //   const content = `
  //   Preceding text
  //   \`[[test-ref]]\`
  //   Following text
  //   `;
  //   const doc = await workspace.openTextDocument({
  //     language: 'markdown',
  //     content: content,
  //   });

  //   expect(
  //     replaceRefs({
  //       refs: [{ old: 'test-ref', new: 'new-test-ref' }],
  //       document: doc,
  //     }),
  //   ).toBe(content);
  // });

  // it('should not replace ref within fenced code block', async () => {
  //   const initialContent = `
  //   \`\`\`
  //   Preceding text
  //   [[test-ref]]
  //   Following text
  //   \`\`\`
  //   `;

  //   const doc = await workspace.openTextDocument({
  //     language: 'markdown',
  //     content: initialContent,
  //   });

  //   expect(
  //     replaceRefs({
  //       refs: [{ old: 'test-ref', new: 'new-test-ref' }],
  //       document: doc,
  //     }),
  //   ).toBe(initialContent);
  // });
});
