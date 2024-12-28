import React, { useState, useEffect } from 'react';
import { Input, InputGroup, IconButton, Tooltip } from '@chakra-ui/react';
import { ChevronUpIcon, ChevronDownIcon, SmallCloseIcon } from '@chakra-ui/icons';

type Props = {
  ref?: React.RefObject<HTMLInputElement>;
  onClose: () => void;
};

const SearchBar: React.FC<Props> = ({ ref, onClose }) => {
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    if (ref?.current) {
      ref.current.focus();
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setSearchText(text);
    if (searchText.trim()) {
      window.electron.ipcRenderer.send('find-in-page', text); // IPC通信で検索
    }
  };

  const handleNext = () => {
    if (searchText.trim()) {
      window.electron.ipcRenderer.send('find-in-page', searchText, {
        findNext: true,
        forward: true
      }); // 次の結果
    }
  };

  const handlePrevious = () => {
    if (searchText.trim()) {
      window.electron.ipcRenderer.send('find-in-page', searchText, {
        findNext: true,
        forward: false
      }); // 前の結果
    }
  };

  const handleClose = () => {
    setSearchText('');
    window.electron.ipcRenderer.send('stop-find-in-page'); // 検索を停止
    onClose();
  };

  return (
    <InputGroup cursor="pointer" size="sm" width={240} m={2}>
      <Input
        type="text"
        value={searchText}
        onChange={handleInputChange}
        placeholder="Search..."
        ref={ref}
      />
      <Tooltip label="前を検索">
        <IconButton
          mx={0.5}
          my={1}
          size="xs"
          isRound={true}
          aria-label="Search previous"
          icon={<ChevronUpIcon />}
          onClick={handlePrevious}
        />
      </Tooltip>
      <Tooltip label="次を検索">
        <IconButton
          mx={0.5}
          my={1}
          size="xs"
          isRound={true}
          aria-label="Search previous"
          icon={<ChevronDownIcon />}
          onClick={handleNext}
        />
      </Tooltip>
      <Tooltip label="閉じる">
        <IconButton
          mx={0.5}
          my={1}
          size="xs"
          isRound={true}
          aria-label="Search previous"
          icon={<SmallCloseIcon />}
          onClick={handleClose}
        />
      </Tooltip>
    </InputGroup>
  );
};

export default SearchBar;
