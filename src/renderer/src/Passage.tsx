import React, { useEffect, useState, useContext } from 'react';
import clsx from 'clsx';
import { NodeObj, createNodeObj, shapeLemma } from './NodeObj';
import AppContext from './AppContext';
import { str } from './tools';
import './assets/passage.css';

const INVALID_CHAR = /[^\x09\x0A\x0D\x20-\xFF\x85\xA0-\uD7FF\uE000-\uFDCF\uFDE0-\uFFFD]/gm;

const colors = [
  'text-red-600',
  'text-yellow-500',
  'text-pink-400',
  'text-red-800',
  'text-purple-600',
  'text-green-500'
];

type PhraseProps = {
  nodeObj: NodeObj;
};

const MuiPhrase: React.FC<PhraseProps> = ({ nodeObj }) => {
  const { targetWord, setTargetWord } = useContext(AppContext);
  const excepts = ['note'];
  const attrs = nodeObj.attrs;

  if (excepts.includes(nodeObj.tag)) return null;

  const textValue = (node_obj: NodeObj) => {
    let text = node_obj.value;
    node_obj.children.forEach((child) => (text += textValue(child)));
    return text;
  };

  const clearHighlight = (class_name: string) => {
    const elems = document.getElementsByClassName(class_name);
    for (const elem of Array.from(elems)) {
      elem.classList.remove(class_name);
    }
  };

  const onClick = (e: React.MouseEvent) => {
    onMouseOver(e);
    if (targetWord.lemma) {
      setTargetWord((prev) => ({ ...prev, fixed: !targetWord.fixed }));
    }
  };

  const currentLemma = () => {
    if (attrs.hasOwnProperty('lemma') && attrs.lemma) {
      let lemma: string = attrs.lemma.split(':').pop() || '';
      if (lemma) lemma = shapeLemma(lemma);
      return lemma;
    } else {
      return '';
    }
  };

  const onMouseOver = async (e: React.MouseEvent) => {
    // const excepts = ['type', 'subType', 'gloss'];
    if (!targetWord.fixed && (attrs.hasOwnProperty('lemma') || attrs.hasOwnProperty('morph'))) {
      e.currentTarget.classList.add('highlight2');
      let lemma: string = str(attrs.lemma).split(':').pop() || '';
      if (lemma) lemma = shapeLemma(lemma);

      let morph: string = str(attrs.morph).split(' ').shift() || '';
      morph = str(morph).split(':').pop() || '';

      setTargetWord((prev) => ({
        ...prev,
        morph,
        lemma,
        text: textValue(nodeObj)
      }));
    }
  };

  const onMouseLeave = () => {
    clearHighlight('highlight2');
  };

  // const renderData = () => {
  //   const attributes =
  //     parent instanceof Element ? Array.from(parent.attributes) : [];
  //   const gloss = attributes.find((attr: Attr) => attr.name === 'gloss');
  //   if (gloss) {
  //     return (
  //       <ruby>
  //         {str(node.nodeValue)}
  //         <rp>（</rp>
  //         <rt>{gloss.value}</rt>
  //         <rp>）</rp>
  //       </ruby>
  //     );
  //   } else {
  //     return <>{str(node.nodeValue)}</>;
  //   }
  // };

  const curLemma = currentLemma();
  const lemmas: string[] = [];
  const color = lemmas.findIndex((lemma) => lemma && lemma === curLemma);

  const contents = () => (
    <span>
      {/* {renderData()} */}
      {nodeObj.value}
      {nodeObj.children.map((childObj, index) =>
        childObj.tag !== '#text' ? (
          <Phrase key={index} nodeObj={childObj} />
        ) : (
          <React.Fragment key={index}>{childObj.value}</React.Fragment>
        )
      )}
    </span>
  );

  return nodeObj.tag === 'root' ? (
    contents()
  ) : (
    <div
      className={clsx('phrase', colors[color], nodeObj.tag)}
      onClick={onClick}
      onMouseOver={onMouseOver}
      onMouseLeave={onMouseLeave}
    >
      {contents()}
    </div>
  );
};

const Phrase = React.memo(MuiPhrase, ({ nodeObj: prevObj }, { nodeObj: nextObj }) => {
  return prevObj.value === nextObj.value && prevObj.attrs === nextObj.attrs;
});

interface PassageProps {
  osisRef: string;
  rawText: string;
  showPosition: 'chapter verse' | 'verse' | 'none';
}

const Passage: React.FC<PassageProps> = ({ osisRef, rawText, showPosition }) => {
  const [nodeObj, setNodeObj] = useState<NodeObj>({
    tag: 'root',
    value: '',
    attrs: {},
    children: []
  });

  useEffect(() => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(
      '<root>' + rawText.replace(INVALID_CHAR, '') + '</root>',
      'text/xml'
    );
    if (doc.childNodes.length > 0) {
      setNodeObj(createNodeObj(doc.childNodes[0]));
    } else {
      setNodeObj({
        tag: 'root',
        value: '',
        attrs: {},
        children: []
      });
    }
  }, [rawText]);

  const getPosition = () => {
    const m = osisRef.match(/(\d+):(\d+)$/);
    if (m) {
      if (showPosition === 'chapter verse') {
        return m[0];
      } else if (showPosition === 'verse') {
        return m[2];
      }
    }
    return '';
  };

  return (
    <>
      {<div className={showPosition}>{getPosition()}</div>}
      <Phrase nodeObj={nodeObj} />
    </>
  );
};

export default Passage;
