import { FieldLabel, useFileUpload } from '@ark-ui/react';
import axios from 'axios';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaDownload, FaTrash, FaTriangleExclamation } from 'react-icons/fa6';

import { saveAs } from 'file-saver';
import { Center, Divider, HStack, Stack, styled } from 'styled-system/jsx';
import { CSVTable } from '~/components/CSVTable';
import { Metadata } from '~/components/layout/Metadata';
import { Alert } from '~/components/ui/alert';
import { Button } from '~/components/ui/button';
import { FileUpload } from '~/components/ui/file-upload';
import { Heading } from '~/components/ui/heading';
import { IconButton } from '~/components/ui/icon-button';
import { Input } from '~/components/ui/input';
import { Text } from '~/components/ui/text';
import { useLocalStorage } from '~/hooks/useLocalStorage';
import { Spinner } from '~/components/ui/spinner';

type FileResult = { fileName: string; csv: string };
export function Page() {
  const { t } = useTranslation();

  const [apiKey, setApiKey] = useLocalStorage('hambot-key', '');

  const [isGeneratingResults, setGeneratingResults] = useState(false);

  const isControlsDisabled = isGeneratingResults;
  const isApiKeyFilled = !!apiKey;

  const fileUpload = useFileUpload({
    disabled: !isApiKeyFilled || isControlsDisabled
  });

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [results, setResults] = useState<FileResult[]>([]);

  const handleGenerateCsv = async () => {
    if (isGeneratingResults) return;
    setGeneratingResults(true);

    const files = fileUpload.acceptedFiles;
    const formData = new FormData();
    files.map((file) => {
      formData.append('files[]', file);
    });

    try {
      const res = await axios.post<string[]>('http://localhost:3001/gemini', formData, {
        headers: {
          ['x-gemini-secret']: apiKey
        }
      });

      const newFiles = files.map((f, idx) => {
        return {
          fileName: f.name,
          csv: res.data[idx]
        };
      });

      console.log(results, newFiles);

      setResults([...results, ...newFiles]);
      setUploadedFiles([...uploadedFiles, ...fileUpload.acceptedFiles]);

      fileUpload.clearFiles();
    } finally {
      setGeneratingResults(false);
    }
  };

  const handleDownloadCsv = (file: FileResult) => {
    saveAs(new Blob([file.csv]), `${file.fileName.split('.')[0]}.csv`);
  };

  const flipCsvAmount = (csv: string) => {
    const rows = csv.split('\n');
    return [
      rows[0],
      ...rows.slice(1).map((row) => {
        const items = row.split(',');
        return [...items.slice(0, -1), Number(items.slice(-1)[0]) * -1].join(',');
      })
    ].join('\n');
  };
  const handleFlipAmount = (index: number) => {
    setResults((r) => {
      return r.map((item, idx) => {
        return idx === index ? { ...item, csv: flipCsvAmount(item.csv) } : item;
      });
    });
  };
  const handleRemoveFile = (index: number) => {
    setResults((r) => {
      return r.filter((_, idx) => {
        return idx !== index;
      });
    });
    setUploadedFiles((r) => {
      return r.filter((_, idx) => {
        return idx !== index;
      });
    });
  };

  return (
    <>
      <Metadata title={t('title')} helmet />
      <Center>
        <Stack alignItems="center" w="full" maxWidth="breakpoint-lg">
          <Heading as="h1" fontSize="2xl">
            {t('title')}
          </Heading>
          <Text>{t('description')}</Text>

          {!isApiKeyFilled && (
            <Alert.Root w="full" bgColor="red.200">
              <Alert.Icon asChild>
                <FaTriangleExclamation />
              </Alert.Icon>
              <Alert.Content>
                {/* <Alert.Title>{t('fill-in-api-key')}</Alert.Title> */}
                <Alert.Description>{t('fill-in-api-key')}</Alert.Description>
              </Alert.Content>
            </Alert.Root>
          )}

          <Stack w="full">
            <FieldLabel htmlFor="apiKey">{t('api-key')}</FieldLabel>
            <Input
              id="apiKey"
              type="password"
              value={apiKey ?? ''}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </Stack>
          <Stack w="full">
            <FileUpload.RootProvider value={fileUpload}>
              <FileUpload.Dropzone>
                <FileUpload.Label>{t('receipts-here')}</FileUpload.Label>
                <FileUpload.Trigger asChild>
                  <Button size="sm">{t('select-files')}</Button>
                </FileUpload.Trigger>
              </FileUpload.Dropzone>
              <FileUpload.ItemGroup>
                <FileUpload.Context>
                  {({ acceptedFiles }) =>
                    acceptedFiles.map((file, id) => (
                      <FileUpload.Item key={id} file={file}>
                        <FileUpload.ItemPreview type="image/*">
                          <FileUpload.ItemPreviewImage />
                        </FileUpload.ItemPreview>
                        <FileUpload.ItemName />
                        <FileUpload.ItemSizeText />
                        <FileUpload.ItemDeleteTrigger asChild>
                          <IconButton variant="link" size="sm">
                            <FaTrash />
                          </IconButton>
                        </FileUpload.ItemDeleteTrigger>
                      </FileUpload.Item>
                    ))
                  }
                </FileUpload.Context>
              </FileUpload.ItemGroup>
              <FileUpload.HiddenInput />
            </FileUpload.RootProvider>
          </Stack>
          <HStack>
            <Button
              onClick={() => void handleGenerateCsv()}
              disabled={
                !isApiKeyFilled || isControlsDisabled || fileUpload.acceptedFiles.length === 0
              }
            >
              Generate CSV
            </Button>
            {isGeneratingResults && <Spinner size="md" />}
          </HStack>
          {results.length > 0 && (
            <Stack w="full">
              <Heading as="h1" fontSize="xl">
                {t('results')}
              </Heading>
              <Stack>
                {results.map((file, index) => (
                  <Stack key={`${index}-${file.fileName}`}>
                    <HStack gap={2} alignItems="stretch">
                      <Stack justifyContent="space-between">
                        <Text fontWeight="bolder">{file.fileName}</Text>
                        <styled.img
                          src={URL.createObjectURL(uploadedFiles[index])}
                          alt={file.fileName}
                          maxH="400px"
                          my="auto"
                        />
                      </Stack>
                      <CSVTable csv={file.csv} />
                      <Stack>
                        <Button onClick={() => handleDownloadCsv(file)}>
                          <FaDownload /> {t('download')}
                        </Button>
                        <Button variant="subtle" onClick={() => handleFlipAmount(index)}>
                          {t('flip-amount')}
                        </Button>
                        <Button variant="subtle" onClick={() => handleRemoveFile(index)}>
                          {t('remove')}
                        </Button>
                      </Stack>
                    </HStack>
                    <Divider />
                  </Stack>
                ))}
              </Stack>
            </Stack>
          )}
        </Stack>
      </Center>
    </>
  );
}
