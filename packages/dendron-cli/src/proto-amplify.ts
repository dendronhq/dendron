import { readYAML } from "@dendronhq/common-server/src";
import fs from "fs-extra";

function genRemap(ent: { src: string; dest: string }) {
  const { src, dest } = ent;
  const target = `/notes/${dest}.html`;
  return {
    source: src,
    target,
    status: "301",
  };
}

function main() {
  const mappings = readYAML(
    "/Users/kevinlin/projects/dendronv2/dendron-kevinslin/migration/mapping.yml"
  );
  const cleanMap = mappings.map((ent: any) => {
    return genRemap(ent);
  });
  const newMap = [
    {
      source: "https://kevinslin.com",
      target: "https://www.kevinslin.com",
      status: "301",
    },
  ];
  fs.writeJSONSync("/tmp/rempa.json", newMap.concat(cleanMap), { spaces: 4 });
}

main();

// [
//     {
//         "source": "/blog/2013/08/26/uno.html",
//         "target": "/thoughts/uno/",
//         "status": "301",
//         "condition": null
//     },
//     {
//         "source": "/blog/2013/09/03/i-have-a-plan.html",
//         "target": "/thoughts/i-have-a-plan/",
//         "status": "301",
//         "condition": null
//     },
//     {
//         "source": "/blog/2013/12/10/noticing-the-trees-among-the-forest.html",
//         "target": "/thoughts/noticing-the-trees-among-the-forest/",
//         "status": "301",
//         "condition": null
//     },
//     {
//         "source": "/blog/2014/01/12/update-s3-deletionpolicy.html",
//         "target": "/thoughts/update-s3-deletionpolicy/",
//         "status": "301",
//         "condition": null
//     },
//     {
//         "source": "/blog/2014/01/19/how-are-you.html",
//         "target": "/thoughts/how-are-you/",
//         "status": "301",
//         "condition": null
//     },
//     {
//         "source": "/blog/2014/05/17/growing-up-and-doing-dishes.html",
//         "target": "/thoughts/growing-up-and-doing-dishes/",
//         "status": "301",
//         "condition": null
//     },
//     {
//         "source": "/blog/2014/06/29/personal_cloud_computing.html",
//         "target": "/thoughts/personal_cloud_computing/",
//         "status": "301",
//         "condition": null
//     },
//     {
//         "source": "/blog/2014/08/03/do_you_remember.html",
//         "target": "/thoughts/do_you_remember/",
//         "status": "301",
//         "condition": null
//     },
//     {
//         "source": "/blog/2015/01/22/sunk-costs.html",
//         "target": "/thoughts/sunk-costs/",
//         "status": "301",
//         "condition": null
//     },
//     {
//         "source": "/blog/2015/09/25/why_i_choose_vim.html",
//         "target": "/thoughts/why_i_choose_vim/",
//         "status": "301",
//         "condition": null
//     },
//     {
//         "source": "/blog/2016/01/03/what_losing_my_luggage_in_nepal_taught_me_about_decision_making.html",
//         "target": "/thoughts/what_losing_my_luggage_in_nepal_taught_me_about_decision_making/",
//         "status": "301",
//         "condition": null
//     },
//     {
//         "source": "/blog/2016/08/31/vr.html",
//         "target": "/thoughts/vr/",
//         "status": "301",
//         "condition": null
//     },
//     {
//         "source": "/blog/2017/01/13/thoughts_on_asia.html",
//         "target": "/thoughts/thoughts_on_asia/",
//         "status": "301",
//         "condition": null
//     },
//     {
//         "source": "/blog/2017/05/31/pelotone.html",
//         "target": "/thoughts/pelotone/",
//         "status": "301",
//         "condition": null
//     },
//     {
//         "source": "/blog/2017/06/20/abstractions_part_1.html",
//         "target": "/thoughts/abstractions_part_1/",
//         "status": "301",
//         "condition": null
//     },
//     {
//         "source": "/blog/2018/03/10/why_i_write.html",
//         "target": "/thoughts/why_i_write/",
//         "status": "301",
//         "condition": null
//     },
//     {
//         "source": "/blog/2018/05/13/chance.html",
//         "target": "/thoughts/chance/",
//         "status": "301",
//         "condition": null
//     },
//     {
//         "source": "/about",
//         "target": "/index.html",
//         "status": "301",
//         "condition": null
//     },
//     {
//         "source": "/about/",
//         "target": "/index.html",
//         "status": "301",
//         "condition": null
//     },
//     {
//         "source": "/<*>",
//         "target": "/index.html",
//         "status": "404",
//         "condition": null
//     }
// ]
