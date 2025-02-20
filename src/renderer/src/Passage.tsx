import React, { useEffect, useState, useContext } from 'react';
import clsx from 'clsx';
import { Text, Tooltip } from '@chakra-ui/react';
import { NodeObj, createNodeObj, shapeLemma } from './NodeObj';
import DictPassage from './DictPassage';
import AppContext from './AppContext';
import { str } from './tools';
import './assets/passage.css';

const INVALID_CHAR = /[^\x09\x0A\x0D\x20-\xFF\x85\xA0-\uD7FF\uE000-\uFDCF\uFDE0-\uFFFD]/gm;

export type ViewOptions = { viewChapter: boolean; viewVerse: boolean; lineBreak: boolean };

const colors = ['red.500', 'blue.500', 'pink.400', 'teal.500', 'purple.500', 'green.500'];

type PhraseProps = {
  nodeObj: NodeObj;
};

const MuiPhrase: React.FC<PhraseProps> = ({ nodeObj }) => {
  const [highlight, setHighlight] = useState(false);
  const { targetWord, setTargetWord, swords } = useContext(AppContext);
  const excepts = ['note'];
  const attrs = nodeObj.attrs;

  if (excepts.includes(nodeObj.tag)) return null;

  const textValue = (node_obj: NodeObj) => {
    let text = node_obj.value;
    node_obj.children.forEach((child) => (text += textValue(child)));
    return text;
  };

  const onClick = () => {
    onMouseOver();
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

  function getMorphologies() {
    return Array.from(swords.values()).filter((sword) => sword.modtype === 'morphology');
  }

  function morphNode(morph: string) {
    const morphMods = getMorphologies();
    const morphTxts = morphMods
      .map((morphMod) => {
        if (morph) return Array.from(morphMod.renderDictText(morph).values()) ?? [];
        else return [];
      })
      .flat()
      .filter((str) => !!str);

    return morphTxts.length > 0 ? <DictPassage rawText={morphTxts.join('')} /> : undefined;
  }

  const onMouseOver = async () => {
    // const excepts = ['type', 'subType', 'gloss'];
    if (!targetWord.fixed && (attrs.hasOwnProperty('lemma') || attrs.hasOwnProperty('morph'))) {
      setHighlight(true);
      let lemma: string = str(attrs.lemma).split(':').pop() || '';
      if (lemma) lemma = shapeLemma(lemma);

      let morph: string = str(attrs.morph).split(' ').shift() || '';
      morph = str(morph).split(':').pop() || '';

      setTargetWord((prev) => ({
        ...prev,
        lemma,
        morph,
        text: textValue(nodeObj)
      }));
    }
  };

  const onMouseLeave = () => {
    setHighlight(false);
    setTargetWord((prev) => ({
      ...prev,
      morph: undefined,
      text: undefined
    }));
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
  const lemmas = (targetWord?.lemma ?? '').split(/[,&]/).map((lem) => shapeLemma(lem));
  const color = lemmas.findIndex((lemma) => lemma && lemma === curLemma);

  const contents = () => (
    <>
      {/* {renderData()} */}
      {nodeObj.value}
      {nodeObj.children.map((childObj, index) =>
        childObj.tag !== '#text' ? (
          <Phrase key={index} nodeObj={childObj} />
        ) : (
          <React.Fragment key={index}>{childObj.value}</React.Fragment>
        )
      )}
    </>
  );

  return nodeObj.tag === 'root' ? (
    contents()
  ) : (
    <Tooltip
      isOpen={highlight}
      hasArrow
      fontSize="small"
      bg="blue.50"
      color="brown"
      label={highlight && targetWord.morph ? morphNode(targetWord.morph) : undefined}
    >
      <Text
        onClick={onClick}
        onMouseOver={onMouseOver}
        onMouseLeave={onMouseLeave}
        fontWeight={highlight ? 700 : undefined}
        color={colors[color]}
        className={clsx('phrase', nodeObj.tag)}
      >
        {contents()}
      </Text>
    </Tooltip>
  );
};

const Phrase = React.memo(MuiPhrase, ({ nodeObj: prevObj }, { nodeObj: nextObj }) => {
  return prevObj.value === nextObj.value && prevObj.attrs === nextObj.attrs;
});

interface PassageProps {
  osisRef: string;
  rawText: string;
  viewOptions: ViewOptions;
}

const Passage: React.FC<PassageProps> = ({ osisRef, rawText, viewOptions }) => {
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
    let str = '';
    const m = osisRef.match(/(\d+):(\d+)$/);
    if (m) {
      if (viewOptions.viewChapter) {
        str += m[1];
      }
      if (viewOptions.viewVerse) {
        if (viewOptions.viewChapter) str += ':';
        str += m[2];
      }
    }
    return str;
  };

  const showPosition = () => {
    const showpos: string[] = [];
    if (viewOptions.viewChapter) showpos.push('chapter');
    if (viewOptions.viewVerse) showpos.push('verse');
    return showpos.join(' ');
  };

  return (
    <>
      {<div className={showPosition()}>{getPosition()}</div>}
      <Phrase nodeObj={nodeObj} />
    </>
  );
};

export default Passage;
