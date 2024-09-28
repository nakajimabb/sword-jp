import React, { useEffect, useState, useContext } from 'react';
import { Box, Flex, Menu, MenuButton, MenuList, MenuItem, Tooltip } from '@chakra-ui/react';
import { SmallCloseIcon } from '@chakra-ui/icons';
import { GiHamburgerMenu } from 'react-icons/gi';
import {
  PiArrowFatDownFill,
  PiArrowFatUpFill,
  PiArrowFatLeftFill,
  PiArrowFatRightFill,
  PiCaretDownFill
} from 'react-icons/pi';
import Sword from '../../utils/Sword';
import Passage from './Passage';
import { truncate } from './tools';
import { ViewOptions } from './Passage';
import AppContext from './AppContext';

type Props = {
  sword?: Sword;
  osisRef: string | string[];
  viewOptions: ViewOptions;
  col: number;
  row: number;
};

const SwordView: React.FC<Props> = ({ sword, osisRef, viewOptions, col, row }) => {
  const [rawTexts, setRawTexts] = useState<Map<string, string>>(new Map());
  const { swords, setLayouts } = useContext(AppContext);

  useEffect(() => {
    (async () => {
      try {
        if (sword) {
          const texts = sword.renderText(osisRef);
          setRawTexts(texts);
        } else {
          setRawTexts(new Map());
        }
      } catch (e) {
        setRawTexts(new Map());
      }
    })();
  }, [sword, osisRef]);

  function addView(dir: 'up' | 'down' | 'left' | 'right') {
    setLayouts((prev) => {
      const after = [...prev];
      if (dir === 'up' || dir === 'down') {
        const index = dir === 'up' ? row : row + 1;
        after[col].splice(index, 0, {
          viewType: 'bible',
          modname: '',
          textSize: 100,
          doubled: false,
          minimized: false,
          disabled: false
        });
      } else if (dir === 'left' || dir === 'right') {
        const index = dir === 'left' ? col : col + 1;
        after.splice(index, 0, [
          {
            viewType: 'bible',
            modname: '',
            textSize: 100,
            doubled: false,
            minimized: false,
            disabled: false
          }
        ]);
      }
      console.log({ after });
      return after;
    });
  }

  function removeView() {
    setLayouts((prev) => {
      const after = [...prev];
      after[col].splice(row, 1);
      // 空列になると列を削除
      if (after[col].length === 0) {
        after.splice(col, 1);
      }
      return after;
    });
  }

  function changeModule(modname: string) {
    setLayouts((prev) => {
      const after = [...prev];
      after[col][row].modname = modname;
      return after;
    });
  }

  function bibleNames() {
    return Array.from(swords.values())
      .filter((sword) => sword.modtype === 'bible')
      .map((sword) => sword.modname);
  }

  return (
    <Box flex={rawTexts.size > 0 ? '1' : '0 0 1.25rem'} overflowY="auto">
      <Box border="1px" borderColor="gray.100" bg="gray.100">
        <Box
          px="0.5rem"
          fontSize="sm"
          letterSpacing="wide"
          boxShadow="lg"
          color="gray.600"
          bg="yellow.200"
          h="1.25rem"
        >
          <Flex justifyContent="space-between">
            <Box>
              <Menu>
                <MenuButton mr="5px">
                  <PiCaretDownFill />
                </MenuButton>
                <MenuList fontSize="sm" minWidth="120px">
                  {bibleNames().map((modname) => {
                    return (
                      <MenuItem fontSize="sm" onClick={() => changeModule(modname)}>
                        {modname}
                      </MenuItem>
                    );
                  })}
                </MenuList>
              </Menu>
              <Tooltip
                isDisabled={!sword}
                hasArrow
                fontSize="small"
                bg="gray.300"
                color="black"
                label={String(sword?.confs?.Description ?? sword?.modname)}
              >
                {truncate(String(sword?.confs?.Description ?? sword?.modname ?? 'none'), 24)}
              </Tooltip>
            </Box>
            <Menu>
              <MenuButton>
                <GiHamburgerMenu />
              </MenuButton>
              <MenuList fontSize="sm" minWidth="120px">
                <MenuItem fontSize="sm" icon={<PiArrowFatUpFill />} onClick={() => addView('up')}>
                  add View Upward
                </MenuItem>
                <MenuItem
                  fontSize="sm"
                  icon={<PiArrowFatDownFill />}
                  onClick={() => addView('down')}
                >
                  add View Downward
                </MenuItem>
                <MenuItem
                  fontSize="sm"
                  icon={<PiArrowFatLeftFill />}
                  onClick={() => addView('left')}
                >
                  add View Left
                </MenuItem>

                <MenuItem
                  fontSize="sm"
                  icon={<PiArrowFatRightFill />}
                  onClick={() => addView('right')}
                >
                  add View Right
                </MenuItem>
                <MenuItem fontSize="sm" icon={<SmallCloseIcon />} onClick={() => removeView()}>
                  remove this View
                </MenuItem>
              </MenuList>
            </Menu>
          </Flex>
        </Box>
        <Box px={2} pt={1} pb={3} className={String(sword?.confs?.Lang ?? '')}>
          {Array.from(rawTexts.entries()).map(([ref, rawText], key) => (
            <>
              <Passage key={key} osisRef={ref} rawText={rawText} viewOptions={viewOptions} />
              {viewOptions.lineBreak && <br />}
            </>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default SwordView;
