var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
// import { IconType } from "antd/lib/notification";
import _ from "lodash";
var DNode = /** @class */ (function () {
    function DNode(props) {
        var _a = _.defaults(props, {
            updated: "TODO",
            created: "TODO",
            id: "TODO",
            schemaId: -1
        }), id = _a.id, title = _a.title, desc = _a.desc, type = _a.type, updated = _a.updated, created = _a.created, parent = _a.parent, children = _a.children, body = _a.body;
        this.id = id;
        this.title = title;
        this.desc = desc;
        this.type = type;
        this.updated = updated;
        this.created = created;
        this.parent = parent;
        this.children = children;
        this.body = body;
    }
    Object.defineProperty(DNode.prototype, "path", {
        get: function () {
            if (this.title === "root") {
                return "";
            }
            if (this.parent && this.parent.title !== "root") {
                return [this.parent.path, this.title].join("/");
            }
            else {
                return this.title;
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DNode.prototype, "url", {
        get: function () {
            return "/doc/" + this.id;
        },
        enumerable: true,
        configurable: true
    });
    DNode.prototype.addChild = function (node) {
        this.children.push(node);
        node.parent = this;
    };
    DNode.prototype.renderBody = function () {
        return this.body || "Empty Document";
    };
    DNode.prototype.toDocument = function () {
        return {
            document: {
                nodes: [
                    {
                        object: "block",
                        type: "paragraph",
                        nodes: [
                            {
                                object: "text",
                                text: this.renderBody()
                            }
                        ]
                    }
                ]
            }
        };
    };
    return DNode;
}());
export { DNode };
var Note = /** @class */ (function (_super) {
    __extends(Note, _super);
    function Note(props) {
        var _this = _super.call(this, __assign(__assign({}, props), { parent: null, children: [] })) || this;
        _this.schemaId = props.schemaId || "-1";
        return _this;
    }
    return Note;
}(DNode));
export { Note };
// === Old
// export class SchemaStubWrapper {
//   static fromSchemaNode(node: SchemaNode): SchemaNodeStub {
//     return _.omit(node, "children", "parent");
//   }
//   static fromSchemaYAMLEntry(
//     entry: SchemaYAMLEntryRaw,
//     opts: YAMLEntryOpts
//   ): SchemaNodeStub {
//     const { id } = opts;
//     const schemaDataKeysDefaults: {
//       [key in SchemaDataKey]: any;
//     } = {
//       aliases: [],
//       kind: undefined,
//       choices: [],
//       title: id,
//       desc: "",
//       type: "schema",
//     };
//     //const title = entry.title ? entry.title : entry.id;
//     const data = _.defaults(
//       {},
//       _.omit(entry, "children"),
//       schemaDataKeysDefaults
//     );
//     const schemaNode = { data, id };
//     return schemaNode;
//   }
// }
// export class SchemaNodeWrapper {
//   static fromSchemaYAMLEntry(
//     entry: SchemaYAMLEntryRaw,
//     opts: YAMLEntryOpts
//   ): SchemaNode {
//     entry = _.defaults(entry, { children: [] });
//     const schemaStub = SchemaStubWrapper.fromSchemaYAMLEntry(entry, opts);
//     const parent = null;
//     const children = _.map(entry.children, (entry, id: string) => {
//       return SchemaStubWrapper.fromSchemaYAMLEntry(entry, { id });
//     });
//     const schemaNode = { ...schemaStub, parent, children };
//     return schemaNode;
//   }
//   // static deserialize(yamlString: string): SchemaTree {
//   //   const schema: SchemaYAML = YAML.parse(yamlString);
//   //   const tree = SchemaTree.fromSchemaYAML(schema);
//   //   return tree;
//   // }
// }
// export class NodeWrapper {
//   public node: DNode;
//   constructor(node: DNode) {
//     this.node = node;
//   }
//   static renderBody(node: DNode) {
//     return node.body || "";
//   }
// }
// export class SchemaTree {
//   public name: string;
//   public root: SchemaNode;
//   public nodes: SchemaNodeDict;
//   constructor(name: string, root: SchemaNode, nodes?: SchemaNodeDict) {
//     this.name = name;
//     this.root = root;
//     this.nodes = _.cloneDeep(nodes) || {};
//     this.addChild(root, null);
//   }
//   /**
//    * Add a subtree and merge all nodes
//    * @param tree
//    * @param parent
//    */
//   addSubTree(tree: SchemaTree, id: string) {
//     const parent = this.nodes[id];
//     this.addChild(tree.root, parent);
//     this.nodes = _.merge(this.nodes, tree.nodes);
//   }
//   addChild(child: SchemaNode, parent: SchemaNode | null) {
//     const childStub = SchemaStubWrapper.fromSchemaNode(child);
//     if (parent) {
//       const parentNode = this.nodes[parent.id];
//       if (_.isUndefined(parentNode)) {
//         throw `no parent with ${parent.id} found`;
//       }
//       parentNode.children.push(childStub);
//     }
//     this.nodes[child.id] = child;
//   }
//   static fromSchemaYAML(yamlString: string): SchemaTree {
//     const schemaYAML: SchemaYAMLRaw = YAML.parse(yamlString);
//     const { name, schema } = schemaYAML;
//     const root = SchemaNodeWrapper.fromSchemaYAMLEntry(schema.root, {
//       id: name,
//     });
//     const tree = new SchemaTree(name, root);
//     const unvisited: SchemaNode[] = [root];
//     while (!_.isEmpty(unvisited)) {
//       const parent: SchemaNode = unvisited.pop() as SchemaNode;
//       _.map(parent.children, ({ id: childId }: SchemaNodeStub) => {
//         // @ts-ignore
//         const entry: SchemaYAMLEntryRaw = schema[childId];
//         const childNode = SchemaNodeWrapper.fromSchemaYAMLEntry(entry, {
//           id: childId,
//         });
//         // NOTE: parent relationships already defined in yaml
//         tree.addChild(childNode, null);
//         unvisited.push(childNode);
//       });
//     }
//     return tree;
//   }
//   toAntDTree() {
//     const schemaNode2AntDNode = (
//       node: SchemaNode,
//       nodeDict: SchemaNodeDict
//     ): DataNode => {
//       const { title } = node.data;
//       const { id } = node;
//       return {
//         title,
//         key: id,
//         children: _.map(node.children, (ch) =>
//           schemaNode2AntDNode(nodeDict[ch.id], nodeDict)
//         ),
//       };
//     };
//     const out = schemaNode2AntDNode(this.root, this.nodes);
//     // replace `root` with name of schema
//     out.title = this.name;
//     return out;
//   }
//   toD3Tree() {
//     const schemaNode2D3Node = (
//       node: SchemaNode,
//       nodeDict: SchemaNodeDict
//     ): ReactD3TreeItemV2<any> => {
//       const { title } = node.data;
//       const { id } = node;
//       return {
//         name: title,
//         id,
//         attributes: {},
//         children: _.map(node.children, (ch) =>
//           schemaNode2D3Node(nodeDict[ch.id], nodeDict)
//         ),
//       };
//     };
//     const out = schemaNode2D3Node(this.root, this.nodes);
//     // replace `root` with name of schema
//     out.name = this.name;
//     return out;
//   }
// }
//# sourceMappingURL=node.js.map