import type * as SqrlType from "squirrelly";
import { useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/lab/LoadingButton";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";
import Drawer from "@mui/material/Drawer";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import { useTheme } from "@mui/material/styles";
import TemplatePreview from "~/components/TemplatePreview";
import { useFetchTemplates } from "./templates.actions";

declare var Sqrl: typeof SqrlType;

const errors: Record<string, string> = {
  to: "Invalid address. Make sure to provide valid email addresses.",
};

const Home: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [toAddr, setToAddr] = useState("");
  const [error, setError] = useState<string>();
  const [subject, setSubject] = useState<string>("");
  const { templates } = useFetchTemplates();
  const [selectedTemplate, setSelectedTemplate] = useState<Template>();
  const [showPreview, setShowPreview] = useState(false);
  const [templateVars, setTemplateVars] = useState<Record<string, string>>({});
  const theme = useTheme();
  const templateHtml = useMemo(() => {
    const vars = { ...templateVars };

    Object.keys(vars).forEach((key) => {
      vars[key] = vars[key].replace(/\n/g, "<br/>");
    });

    return Sqrl.render(selectedTemplate?.html || "", vars);
  }, [templateVars]);

  useEffect(() => {
    if (templates?.length > 0) {
      setSelectedTemplate(templates[0]);
    }
  }, [templates]);

  useEffect(() => {
    setTemplateVars(
      selectedTemplate?.variables?.reduce((obj, key) => {
        obj[key] = key;
        return obj;
      }, {} as Record<string, string>) || {}
    );
  }, [selectedTemplate]);

  const sendEmail = () => {
    setIsLoading(true);
    setError(undefined);

    if (!toAddr || toAddr.indexOf("@") === -1) {
      setIsLoading(false);
      setError(errors.to);

      const inputField = document.querySelector(
        "#to-field"
      ) as HTMLInputElement;

      return inputField?.focus();
    }

    const data: Record<string, string> = {};
    const form = document.querySelector(
      "#manual-email-form"
    ) as HTMLFormElement;

    selectedTemplate?.variables?.forEach((variable) => {
      const { value } = form[`data[${variable}]`] || {};

      if (value) {
        data[variable] = value.replace(/\n/g, "<br/>");
      }
    });

    fetch("/api/mail", {
      method: "POST",
      body: JSON.stringify({
        email: toAddr.split(";").map((e) => e.trim()),
        templateId: selectedTemplate?.recordId,
        data,
        subject,
      }),
    })
      .then(async (res) => {
        console.log(await res.json());
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <Box sx={{ m: 2, display: "flex", justifyContent: "center" }}>
      <Box
        color="info.main"
        maxWidth="560px"
        sx={{
          flex: 1,
          py: 2,
          pt: 0,
        }}
      >
        <Typography variant="h6" sx={{ mt: 0, mb: 3, opacity: 0.5 }}>
          Send Email Manually
        </Typography>
        <form
          id="manual-email-form"
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <Typography
            sx={{
              bgcolor: theme.palette.primary.light,
              borderBottom: "1px solid rgba(0,0,0,0.3)",
              py: 1,
              px: 1.5,
              cursor: "not-allowed",
              fontSize: 14,
            }}
          >
            <Typography
              sx={{ fontSize: 12, mb: 0.25, display: "block", opacity: 0.4 }}
              component="span"
            >
              From
            </Typography>{" "}
            {process.env.MAILER_FROM_ADDR}
          </Typography>
          <Box
            sx={{
              pt: 2,
              mb: 2,
            }}
          >
            <TextField
              color="primary"
              variant="filled"
              label="To"
              value={toAddr}
              error={errors.to === error}
              autoComplete="off"
              autoFocus
              placeholder="janny@doe.com; joe@doe.com"
              InputProps={{ id: "to-field" }}
              onChange={(e) => setToAddr(e.currentTarget.value)}
              fullWidth
            />
          </Box>
          <Box
            sx={{
              mb: 2,
            }}
          >
            <TextField
              color="primary"
              variant="filled"
              label="Subject"
              value={subject}
              autoComplete="off"
              placeholder={
                selectedTemplate?.defaultSubject || "Subject of the email"
              }
              onChange={(e) => setSubject(e.currentTarget.value)}
              fullWidth
            />
          </Box>
          <FormControl
            variant="filled"
            fullWidth
            sx={{ mb: selectedTemplate?.variables ? 0 : 2 }}
          >
            <InputLabel
              id="template-select"
              sx={{ color: "white", opacity: 0.4 }}
              color="info"
            >
              Template
            </InputLabel>
            <Select
              labelId="template-select"
              sx={{ color: "white" }}
              value={selectedTemplate?.recordId || ""}
              onChange={(e) => {
                setSelectedTemplate(
                  templates.find((t) => t.recordId === e.target.value)
                );
              }}
            >
              {templates?.map((template) => (
                <MenuItem key={template.recordId} value={template.recordId}>
                  {template.name} (<b>#{template.recordId}</b>)
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {selectedTemplate?.variables ? (
            <Box>
              <Typography variant="h6" sx={{ mb: 2, mt: 3, opacity: 0.5 }}>
                Template Variables
              </Typography>
              {selectedTemplate.variables.map((variable) => (
                <TextField
                  key={variable}
                  multiline
                  fullWidth
                  value={templateVars[variable] || ""}
                  variant="filled"
                  sx={{ mb: 2 }}
                  label={`it.${variable}`}
                  color="primary"
                  name={`data[${variable}]`}
                  onChange={(e) => {
                    setTemplateVars({
                      ...templateVars,
                      [variable]: e.target.value,
                    });
                  }}
                />
              ))}
            </Box>
          ) : (
            ""
          )}
          {error && (
            <Alert color="error" sx={{ mb: 2 }}>
              <AlertTitle>Error</AlertTitle>
              <Typography>{error}</Typography>
            </Alert>
          )}
          <Box sx={{ textAlign: "center" }}>
            <Button
              variant="outlined"
              color="secondary"
              loading={isLoading}
              onClick={(e) => {
                e.preventDefault();
                setShowPreview(true);
              }}
            >
              Preview & Send
            </Button>
          </Box>
        </form>
      </Box>
      <Drawer
        open={showPreview}
        PaperProps={{ sx: { bgcolor: "transparent" } }}
        onClose={() => {
          setShowPreview(false);
        }}
        anchor="right"
        sx={{ m: 2 }}
      >
        <DialogTitle
          sx={{
            bgcolor: theme.palette.primary.dark,
            color: "white",
            width: "600px",
          }}
        >
          <Typography>Preview</Typography>
          <IconButton
            aria-label="close"
            onClick={() => {
              setShowPreview(false);
            }}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <Box
          sx={{
            flex: 1,
            fontFamily: "monospace",
          }}
        >
          <TemplatePreview
            isLoading={isLoading}
            onSend={() => {
              sendEmail();
            }}
            onClose={() => {
              setShowPreview(false);
            }}
          >
            <div
              dangerouslySetInnerHTML={{
                __html: templateHtml,
              }}
            ></div>
          </TemplatePreview>
        </Box>
      </Drawer>
    </Box>
  );
};

export default Home;
