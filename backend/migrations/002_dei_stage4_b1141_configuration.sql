-- DEI Stage 4 — B1141 canonical instance configuration
-- 2026-09-04
--
-- Purpose:
--   Configure the two academically approved B1141 DEI instances against the
--   accepted DEI v1 engine while keeping all teaching rows inactive.
--
-- Boundary:
--   * configuration/content only;
--   * no activity activation;
--   * no session/trace mutation;
--   * no engine/schema redesign;
--   * any earlier Week 9 Stage 3 validation row is retained as historical
--     validation material and is not repurposed as the Week 8 canonical row.

BEGIN;

DO $guard$
DECLARE
  active_canonical integer;
  active_old_validation integer;
BEGIN
  SELECT COUNT(*) FILTER (WHERE active)
    INTO active_canonical
  FROM activities
  WHERE id IN (
    'b1141-w2-who-dopes-dei',
    'b1141-w8-disclosure-sequence-dei'
  )
    AND model = 'dei';

  IF active_canonical <> 0 THEN
    RAISE EXCEPTION 'DEI Stage 4 requires canonical rows inactive; % active canonical row(s) found', active_canonical;
  END IF;

  SELECT COUNT(*) FILTER (WHERE active)
    INTO active_old_validation
  FROM activities
  WHERE id = 'b1141-w9-disclosure-sequence-dei'
    AND model = 'dei';

  IF active_old_validation <> 0 THEN
    RAISE EXCEPTION 'Old DEI Stage 3 validation row is active; Stage 4 will not mutate or replace a live validation row';
  END IF;
END
$guard$;

INSERT INTO activities (id, title, model, schema_version, active, config)
VALUES (
  'b1141-w2-who-dopes-dei',
  'Who Dopes?',
  'dei',
  1,
  false,
  $config$
  {
    "response": {
      "prompt": "Doping in elite sport is better explained by athletes' individual choices than by pressures within the sporting environment.",
      "instruction_initial": "Choose the response that best reflects your view.",
      "instruction_revised": "With this information in mind, respond to the same statement again.",
      "scale_labels": ["Strongly disagree", "Disagree", "Neither agree nor disagree", "Agree", "Strongly agree"]
    },
    "review": {
      "instruction": "Review the following information. You'll then respond to the same statement again.",
      "continue_label": "Continue"
    },
    "information": [
      {
        "id": "system",
        "type": "fact",
        "title": "An organised system",
        "body": "The 2016 McLaren Independent Investigation for the World Anti-Doping Agency reported an institutionalised doping conspiracy involving athletes and officials across multiple Russian sporting and state organisations. Athletes were operating within an organised infrastructure rather than simply acting as isolated individuals.",
        "source_note": "WADA — McLaren Independent Investigation Report, Part II (2016)."
      },
      {
        "id": "competitions",
        "type": "context",
        "title": "Across major competitions",
        "body": "The same investigation described a systematic and centralised process for manipulating doping controls across several major international competitions, with sample-swapping practices continuing beyond the Sochi 2014 Winter Olympics.",
        "source_note": "WADA — McLaren Independent Investigation Report, Part II (2016)."
      }
    ],
    "results": {
      "heading": "What changed — if anything?",
      "intro": "Here is how the class responded before and after.",
      "discussion_prompts": [
        "Why did the same information affect people differently?",
        "Does evidence of an organised system change how we explain doping without removing individual responsibility?",
        "What else would you need to know before changing your position further?"
      ]
    }
  }
  $config$::jsonb
)
ON CONFLICT (id) DO UPDATE
SET
  title = EXCLUDED.title,
  schema_version = EXCLUDED.schema_version,
  config = EXCLUDED.config,
  updated_at = now()
WHERE activities.model = 'dei'
  AND activities.active = false;

INSERT INTO activities (id, title, model, schema_version, active, config)
VALUES (
  'b1141-w8-disclosure-sequence-dei',
  'A Club Responds',
  'dei',
  1,
  false,
  $config$
  {
    "response": {
      "prompt": "An elite athlete tells their club that they are experiencing mental-health difficulties. The club publicly says it supports the athlete and will work with them. The club's public response is good evidence that it genuinely supports the athlete.",
      "instruction_initial": "Choose the response that best reflects your view.",
      "instruction_revised": "With this information in mind, respond to the same statement again.",
      "scale_labels": ["Strongly disagree", "Disagree", "Neither agree nor disagree", "Agree", "Strongly agree"]
    },
    "review": {
      "instruction": "Review what happened next. You'll then respond to the same statement again.",
      "continue_label": "Continue"
    },
    "information": [
      {
        "id": "later-decision",
        "type": "later_event",
        "title": "What happened next",
        "body": "In the following weeks, the athlete is dropped from the squad. The club says the decision is performance-related. There is no direct evidence linking the decision to the earlier disclosure.",
        "source_note": "Fictional teaching scenario."
      }
    ],
    "results": {
      "heading": "What changed — if anything?",
      "intro": "Here is how the class responded before and after.",
      "discussion_prompts": [
        "Did what happened next change how you read the club's original statement?",
        "Is the timing enough to doubt the club's explanation?",
        "What else would you need to know?"
      ]
    }
  }
  $config$::jsonb
)
ON CONFLICT (id) DO UPDATE
SET
  title = EXCLUDED.title,
  schema_version = EXCLUDED.schema_version,
  config = EXCLUDED.config,
  updated_at = now()
WHERE activities.model = 'dei'
  AND activities.active = false;

DO $verify$
DECLARE
  canonical_count integer;
  active_count integer;
BEGIN
  SELECT COUNT(*), COUNT(*) FILTER (WHERE active)
    INTO canonical_count, active_count
  FROM activities
  WHERE id IN (
    'b1141-w2-who-dopes-dei',
    'b1141-w8-disclosure-sequence-dei'
  )
    AND model = 'dei';

  IF canonical_count <> 2 THEN
    RAISE EXCEPTION 'DEI Stage 4 expected exactly 2 canonical B1141 rows after configuration; found %', canonical_count;
  END IF;

  IF active_count <> 0 THEN
    RAISE EXCEPTION 'DEI Stage 4 canonical rows must remain inactive; % active row(s) found', active_count;
  END IF;
END
$verify$;

COMMIT;
