import { Note } from "../../node";
import path from "path";
export function denddronId2DxId(did) {
    return "id:" + did;
}
export function dxId2DendronId(dxId) {
    return dxId.slice(3);
}
export function fileNameToTitle(name) {
    var ext = path.extname(name);
    return path.basename(name, ext);
}
export function fileNameToTreePath(name) {
    var title = fileNameToTitle(name);
    return title.split(".");
}
export function fileToNote(meta, body) {
    var title = fileNameToTitle(meta.name);
    var id = dxId2DendronId(meta.id);
    var note = new Note({
        id: id,
        title: title,
        desc: "TODO",
        type: "note",
        schemaId: "-1",
        body: body
    });
    return note;
}
//# sourceMappingURL=utils.js.map