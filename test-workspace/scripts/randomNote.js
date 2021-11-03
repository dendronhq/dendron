#!/usr/bin/env node
/** Creates a randomly generated note.
 *
 * The generated note will contain paragraphs, lists, tables, wikilinks, block
 * anchors etc., trying to make use of Dendron features.
 *
 * There is currently no options for this script, but you can edit the following variables to edit what gets generated.
 */
/* eslint-disable no-console */
/* eslint-disable no-lone-blocks */
/* eslint-disable no-plusplus */
const _ = require("lodash");

/** How many markdown elements to generate. */
/** How many items at most a generated list can have. */
const LONGEST_LIST = 5;
/** What ratio of paragraphs or list items should have block anchors */
const WITH_BLOCK_ANCHOR = 0.2;
/** What ratio of wikilinks should be to the same file */
const SAME_FILE_WIKILINK = 0.3;

// -----  setup  -----

const RandomTextGenerator = require("./random_text_generator_node");

/** An input text for the random text generator to seed it. These are excerpts from The Project Gutenberg eBook of The Adventures of Sherlock Holmes, by Arthur Conan Doyle. */
const INPUT_TEXT =
  `When Mrs. Turner has brought in the tray I will make it clear to you. Now," he said as he turned hungrily on the simple fare that our landlady had provided, "I must discuss it while I eat, for I have not much time. It is nearly five now. In two hours we must be on the scene of action. Miss Irene, or Madame, rather, returns from her drive at seven. We must be at Briony Lodge to meet her. It is nothing very formidable,” he said, taking a long cigar-shaped roll from his pocket. “It is an ordinary plumber’s smoke-rocket, fitted with a cap at either end to make it self-lighting. Your task is confined to that. When you raise your cry of fire, it will be taken up by quite a number of people. You may then walk to the end of the street, and I will rejoin you in ten minutes. I hope that I have made myself clear? He disappeared into his bedroom and returned in a few minutes in the character of an amiable and simple-minded Nonconformist clergyman. His broad black hat, his baggy trousers, his white tie, his sympathetic smile, and general look of peering and benevolent curiosity were such as Mr. John Hare alone could have equalled. It was not merely that Holmes changed his costume. His expression, his manner, his very soul seemed to vary with every fresh part that he assumed. The stage lost a fine actor, even as science lost an acute reasoner, when he became a specialist in crime. It was a quarter past six when we left Baker Street, and it still wanted ten minutes to the hour when we found ourselves in Serpentine Avenue. It was already dusk, and the lamps were just being lighted as we paced up and down in front of Briony Lodge, waiting for the coming of its occupant. The house was just such as I had pictured it from Sherlock Holmes’ succinct description, but the locality appeared to be less private than I expected. On the contrary, for a small street in a quiet neighbourhood, it was remarkably animated. There was a group of shabbily dressed men smoking and laughing in a corner, a scissors-grinder with his wheel, two guardsmen who were flirting with a nurse-girl, and several well-dressed young men who were lounging up and down with cigars in their mouths. As he spoke the gleam of the sidelights of a carriage came round the curve of the avenue. It was a smart little landau which rattled up to the door of Briony Lodge. As it pulled up, one of the loafing men at the corner dashed forward to open the door in the hope of earning a copper, but was elbowed away by another loafer, who had rushed up with the same intention. A fierce quarrel broke out, which was increased by the two guardsmen, who took sides with one of the loungers, and by the scissors-grinder, who was equally hot upon the other side. A blow was struck, and in an instant the lady, who had stepped from her carriage, was the centre of a little knot of flushed and struggling men, who struck savagely at each other with their fists and sticks. Holmes dashed into the crowd to protect the lady; but, just as he reached her, he gave a cry and dropped to the ground, with the blood running freely down his face. At his fall the guardsmen took to their heels in one direction and the loungers in the other, while a number of better dressed people, who had watched the scuffle without taking part in it, crowded in to help the lady and to attend to the injured man. Irene Adler, as I will still call her, had hurried up the steps; but she stood at the top with her superb figure outlined against the lights of the hall, looking back into the street. At three o’clock precisely I was at Baker Street, but Holmes had not yet returned. The landlady informed me that he had left the house shortly after eight o’clock in the morning. I sat down beside the fire, however, with the intention of awaiting him, however long he might be. I was already deeply interested in his inquiry, for, though it was surrounded by none of the grim and strange features which were associated with the two crimes which I have already recorded, still, the nature of the case and the exalted station of his client gave it a character of its own. Indeed, apart from the nature of the investigation which my friend had on hand, there was something in his masterly grasp of a situation, and his keen, incisive reasoning, which made it a pleasure to me to study his system of work, and to follow the quick, subtle methods by which he disentangled the most inextricable mysteries. So accustomed was I to his invariable success that the very possibility of his failing had ceased to enter into my head. It was close upon four before the door opened, and a drunken-looking groom, ill-kempt and side-whiskered, with an inflamed face and disreputable clothes, walked into the room. Accustomed as I was to my friend’s amazing powers in the use of disguises, I had to look three times before I was certain that it was indeed he. With a nod he vanished into the bedroom, whence he emerged in five minutes tweed-suited and respectable, as of old. Putting his hands into his pockets, he stretched out his legs in front of the fire and laughed heartily for some minutes. Quite so; but the sequel was rather unusual. I will tell you, however. I left the house a little after eight o’clock this morning in the character of a groom out of work. There is a wonderful sympathy and freemasonry among horsey men. Be one of them, and you will know all that there is to know. I soon found Briony Lodge. It is a _bijou_ villa, with a garden at the back, but built out in front right up to the road, two stories. Chubb lock to the door. Large sitting-room on the right side, well furnished, with long windows almost to the floor, and those preposterous English window fasteners which a child could open. Behind there was nothing remarkable, save that the passage window could be reached from the top of the coach-house. I walked round it and examined it closely from every point of view, but without noting anything else of interest. I then lounged down the street and found, as I expected, that there was a mews in a lane which runs down by one wall of the garden. I lent the ostlers a hand in rubbing down their horses, and received in exchange twopence, a glass of half-and-half, two fills of shag tobacco, and as much information as I could desire about Miss Adler, to say nothing of half a dozen other people in the neighbourhood in whom I was not in the least interested, but whose biographies I was compelled to listen to. Oh, she has turned all the men’s heads down in that part. She is the daintiest thing under a bonnet on this planet. So say the Serpentine-mews, to a man. She lives quietly, sings at concerts, drives out at five every day, and returns at seven sharp for dinner. Seldom goes out at other times, except when she sings. Has only one male visitor, but a good deal of him. He is dark, handsome, and dashing, never calls less than once a day, and often twice. He is a Mr. Godfrey Norton, of the Inner Temple. See the advantages of a cabman as a confidant. They had driven him home a dozen times from Serpentine-mews, and knew all about him. When I had listened to all they had to tell, I began to walk up and down near Briony Lodge once more, and to think over my plan of campaign. This Godfrey Norton was evidently an important factor in the matter. He was a lawyer. That sounded ominous. What was the relation between them, and what the object of his repeated visits? Was she his client, his friend, or his mistress? If the former, she had probably transferred the photograph to his keeping. If the latter, it was less likely. On the issue of this question depended whether I should continue my work at Briony Lodge, or turn my attention to the gentleman’s chambers in the Temple. It was a delicate point, and it widened the field of my inquiry. I fear that I bore you with these details, but I have to let you see my little difficulties, if you are to understand the situation. I was still balancing the matter in my mind when a hansom cab drove up to Briony Lodge, and a gentleman sprang out. He was a remarkably handsome man, dark, aquiline, and moustached—evidently the man of whom I had heard. He appeared to be in a great hurry, shouted to the cabman to wait, and brushed past the maid who opened the door with the air of a man who was thoroughly at home. Away they went, and I was just wondering whether I should not do well to follow them when up the lane came a neat little landau, the coachman with his coat only half-buttoned, and his tie under his ear, while all the tags of his harness were sticking out of the buckles. It hadn’t pulled up before she shot out of the hall door and into it. I only caught a glimpse of her at the moment, but she was a lovely woman, with a face that a man might die for. I was half-dragged up to the altar, and before I knew where I was I found myself mumbling responses which were whispered in my ear, and vouching for things of which I knew nothing, and generally assisting in the secure tying up of Irene Adler, spinster, to Godfrey Norton, bachelor. It was all done in an instant, and there was the gentleman thanking me on the one side and the lady on the other, while the clergyman beamed on me in front. It was the most preposterous position in which I ever found myself in my life, and it was the thought of it that started me laughing just now. It seems that there had been some informality about their license, that the clergyman absolutely refused to marry them without a witness of some sort, and that my lucky appearance saved the bridegroom from having to sally out into the streets in search of a best man. The bride gave me a sovereign, and I mean to wear it on my watch chain in memory of the occasion.`.split(
    /[.?!]/
  );

const paragraphGenerator = new RandomTextGenerator({
  splitter: " ",
  deepness: 8,
  minLength: 20,
  maxLength: 80,
});
const shortGenerator = new RandomTextGenerator({
  splitter: " ",
  deepness: 8,
  minLength: 1,
  maxLength: 4,
});
const wordGenerator = new RandomTextGenerator({
  splitter: "",
  deepness: 12,
  minLength: 1,
  maxLength: 16,
});
for (let sentence of INPUT_TEXT) {
  sentence = sentence.trim();
  const words = sentence.split(" ");
  paragraphGenerator.learn(words);
  shortGenerator.learn(words);
  for (const word of words) {
    wordGenerator.learn(word.replace(/[,.!?']/));
  }
}

function randomTimestampDuration() {
  return Math.floor(Math.random() * 100000000000);
}

function randomTimestamp() {
  return randomTimestampDuration() + 1500000000000;
}

const PREV_ANCHORS = new Set();

const GENERATORS = {
  paragraph: (noNewLine) => {
    let paragraph = paragraphGenerator.generate();
    if (Math.random() < WITH_BLOCK_ANCHOR) {
      let newAnchor = `^${wordGenerator.generate()}`;
      if (PREV_ANCHORS.has(newAnchor)) {
        newAnchor = `^${randomTimestampDuration()}`;
      }
      PREV_ANCHORS.add(newAnchor);
      paragraph = `${paragraph} ${newAnchor}`;
    }
    if (!noNewLine && Math.random() < 0.95) paragraph = `\n${paragraph}\n`;
    return paragraph;
  },
  list: () => {
    let list = "\n";
    const itemCount = Math.ceil(Math.random() * LONGEST_LIST);
    for (let i = 0; i < LONGEST_LIST && i < itemCount; i++) {
      list = `${list}\n- ${GENERATORS.paragraph(true)}`;
    }
    list = `${list}\n\n`;
    return list;
  },
  header: () => {
    const depth = Math.ceil(Math.random() * 4);
    let header = "";
    for (let i = 0; i < depth; i++) {
      header = `#${header}`;
    }
    header = `${header} ${shortGenerator.generate()}`;
    return header;
  },
  wikilink: () => {
    if (Math.random() < SAME_FILE_WIKILINK && PREV_ANCHORS.size > 0) {
      const anchors = [...PREV_ANCHORS];
      // samefile
      return `[[#${anchors[Math.floor(Math.random() * anchors.length)]}]]`;
    } else {
      let wikilink = `[[${wordGenerator.generate()}`;
      const depth = Math.floor(Math.random() * 5);
      for (let i = 0; i < depth; i++) {
        wikilink = `${wikilink}.${wordGenerator.generate()}`;
      }
      if (Math.random() < 0.3) {
        const anchorDepth = Math.floor(Math.random() * 5);
        wikilink = `${wikilink}#${wordGenerator.generate()}`;
        for (let i = 0; i < anchorDepth; i++) {
          wikilink = `${wikilink}-${wordGenerator.generate()}`;
        }
      } else if (Math.random() < 0.1) {
        wikilink = `${wikilink}#${shortGenerator.generate()}`;
      }
      wikilink = `${wikilink}]]`;
      return wikilink;
    }
  },
};

// -----  output  -----
// generate frontmatter

function generateNote(opts) {
  const { generatedLength } = _.defaults(opts, { generatedLength: 1000 });
  const created = randomTimestamp();
  const fm = `---
id: "${Math.random()}"
title: ${shortGenerator.generate()}
desc: ${shortGenerator.generate()}
updated: ${created + randomTimestampDuration()}
created: ${created}
stub: false
---\n`;
  const pickGenerators = Object.values(GENERATORS);
  const out = [fm];
  for (let i = 0; i < generatedLength; i++) {
    const pick =
      pickGenerators[Math.floor(Math.random() * pickGenerators.length)];
    out.push(pick());
  }
  return out.join("");
}

module.exports = {
  generateNote,
};
