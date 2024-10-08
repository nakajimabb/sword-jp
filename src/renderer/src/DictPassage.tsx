import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import { NodeObj, createNodeObj, shapeLemma } from './NodeObj';
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
  const excepts = ['note'];
  const attrs = nodeObj.attrs;

  if (excepts.includes(nodeObj.tag)) return null;

  const textValue = (node_obj: NodeObj) => {
    let text = node_obj.value;
    node_obj.children.forEach((child) => (text += textValue(child)));
    return text;
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

  const curLemma = currentLemma();
  const lemmas: string[] = [];
  const color = lemmas.findIndex((lemma) => lemma && lemma === curLemma);

  const contents = () => (
    <span>
      {/* {renderData()} */}
      {nodeObj.value}
      {nodeObj.children.map((childObj, index) =>
        childObj.tag !== '#text' ? (
          <>
            <Phrase key={index} nodeObj={childObj} />
            &nbsp;
          </>
        ) : (
          <React.Fragment key={index}>{childObj.value}</React.Fragment>
        )
      )}
    </span>
  );

  return nodeObj.tag === 'root' ? (
    contents()
  ) : (
    <div className={clsx('phrase', colors[color], nodeObj.tag)}>{contents()}</div>
  );
};

const Phrase = React.memo(MuiPhrase, ({ nodeObj: prevObj }, { nodeObj: nextObj }) => {
  return prevObj.value === nextObj.value && prevObj.attrs === nextObj.attrs;
});

interface DictPassageProps {
  rawText: string;
}

const DictPassage: React.FC<DictPassageProps> = ({ rawText }) => {
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

  return <Phrase nodeObj={nodeObj} />;
};

export default DictPassage;
