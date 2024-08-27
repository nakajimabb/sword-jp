import { str, zeroPadding } from './tools';

export interface NodeObj {
  tag: string;
  value: string;
  attrs: { [key: string]: string };
  children: NodeObj[];
}

export const createNodeObj = (node: Node): NodeObj => {
  let obj = createSelfNodeObj(node);
  node.childNodes.forEach((child) => {
    obj.children.push(createNodeObj(child));
  });
  return obj;
};

const createSelfNodeObj = (node: Node): NodeObj => {
  const attrs =
    node instanceof Element && node.attributes
      ? Object.assign(
          {},
          ...Array.from(node.attributes).map((attr) => ({
            [attr.name]: attr.nodeValue,
          }))
        )
      : {};
  return {
    tag: node.nodeName,
    value: str(node.nodeValue),
    attrs: attrs,
    children: [],
  };
};

export const shapeLemma = (lemma: string) => {
  let m = lemma.match(/([GH])(\d+)/);
  if (m && m[1] && m[2]) {
    return m[1] + zeroPadding(+m[2], 4);
  } else {
    return lemma;
  }
};
