# Alpha Screener State Machine Diagrams

## 1. Data Ingestion State Machine

```mermaid
stateDiagram-v2
    [*] --> IDLE
    IDLE --> FETCHING_DOCUMENTATION: analyze()

    FETCHING_DOCUMENTATION --> DOCUMENTATION_FETCHED: success
    FETCHING_DOCUMENTATION --> FAILED: error

    DOCUMENTATION_FETCHED --> FETCHING_FUNDING: has_funding_signal
    DOCUMENTATION_FETCHED --> FETCHING_MARKET: no_funding_signal

    FETCHING_FUNDING --> FUNDING_FETCHED: success
    FETCHING_FUNDING --> FETCHING_MARKET: not_found
    FETCHING_FUNDING --> FAILED: error

    FUNDING_FETCHED --> FETCHING_MARKET

    FETCHING_MARKET --> MARKET_FETCHED: success
    FETCHING_MARKET --> FAILED: error

    MARKET_FETCHED --> FETCHING_TEAM

    FETCHING_TEAM --> TEAM_FETCHED: success
    FETCHING_TEAM --> FAILED: error

    TEAM_FETCHED --> FETCHING_CODE: has_github
    TEAM_FETCHED --> DATA_COMPLETE: no_github

    FETCHING_CODE --> CODE_FETCHED: success
    FETCHING_CODE --> DATA_COMPLETE: not_found
    FETCHING_CODE --> FAILED: error

    CODE_FETCHED --> DATA_COMPLETE
    DATA_COMPLETE --> [*]
    FAILED --> [*]
```

## 2. Analysis Pipeline State Machine

```mermaid
stateDiagram-v2
    [*] --> IDLE

    IDLE --> ANALYZING_DOCUMENTATION: data_ready

    ANALYZING_DOCUMENTATION --> DOCUMENTATION_ANALYZED: ai_complete
    ANALYZING_DOCUMENTATION --> FAILED: error

    DOCUMENTATION_ANALYZED --> CHECKING_FUNDING_SIGNAL

    CHECKING_FUNDING_SIGNAL --> ANALYZING_FUNDING: signal_detected
    CHECKING_FUNDING_SIGNAL --> NO_FUNDING: no_signal

    NO_FUNDING --> ANALYZING_MARKET

    ANALYZING_FUNDING --> FUNDING_ANALYZED: complete
    ANALYZING_FUNDING --> ANALYZING_MARKET: no_data

    FUNDING_ANALYZED --> ANALYZING_MARKET

    ANALYZING_MARKET --> MARKET_ANALYZED: ai_complete
    ANALYZING_MARKET --> FAILED: error

    MARKET_ANALYZED --> ANALYZING_TEAM

    ANALYZING_TEAM --> TEAM_ANALYZED: ai_complete
    ANALYZING_TEAM --> FAILED: error

    TEAM_ANALYZED --> ANALYZING_CODE: has_repo
    TEAM_ANALYZED --> GENERATING_RATING: no_repo

    ANALYZING_CODE --> CODE_ANALYZED: ai_complete
    ANALYZING_CODE --> GENERATING_RATING: skip

    CODE_ANALYZED --> GENERATING_RATING

    GENERATING_RATING --> RATING_COMPLETE: ai_complete
    GENERATING_RATING --> FAILED: error

    RATING_COMPLETE --> [*]
    FAILED --> [*]
```

## 3. Rating Generation State Machine

```mermaid
stateDiagram-v2
    [*] --> COLLECTING_SCORES

    COLLECTING_SCORES --> CALCULATING_CONSISTENCY: all_analyses_ready

    CALCULATING_CONSISTENCY --> CONSISTENCY_SCORED
    CONSISTENCY_SCORED --> CALCULATING_OPPORTUNITY

    CALCULATING_OPPORTUNITY --> OPPORTUNITY_SCORED
    OPPORTUNITY_SCORED --> CALCULATING_EXECUTION

    CALCULATING_EXECUTION --> EXECUTION_SCORED
    EXECUTION_SCORED --> DETERMINING_GRADE

    DETERMINING_GRADE --> GRADE_A: score >= 80
    DETERMINING_GRADE --> GRADE_B: score >= 60
    DETERMINING_GRADE --> GRADE_C: score >= 40
    DETERMINING_GRADE --> GRADE_D: score < 40

    GRADE_A --> GENERATING_SUMMARY
    GRADE_B --> GENERATING_SUMMARY
    GRADE_C --> GENERATING_SUMMARY
    GRADE_D --> GENERATING_SUMMARY

    GENERATING_SUMMARY --> IDENTIFYING_STRENGTHS
    IDENTIFYING_STRENGTHS --> IDENTIFYING_RISKS
    IDENTIFYING_RISKS --> IDENTIFYING_RED_FLAGS
    IDENTIFYING_RED_FLAGS --> CALCULATING_UPSIDE

    CALCULATING_UPSIDE --> RATING_COMPLETE
    RATING_COMPLETE --> [*]
```

## 4. Discord Bot Interaction State Machine

```mermaid
stateDiagram-v2
    [*] --> WAITING_FOR_COMMAND

    WAITING_FOR_COMMAND --> PARSING_COMMAND: /analyze received

    PARSING_COMMAND --> VALIDATING_INPUT: parsed
    PARSING_COMMAND --> ERROR_RESPONSE: parse_error

    VALIDATING_INPUT --> DEFERRING_REPLY: valid
    VALIDATING_INPUT --> ERROR_RESPONSE: invalid

    DEFERRING_REPLY --> STARTING_ANALYSIS: deferred

    STARTING_ANALYSIS --> PROGRESS_UPDATE: analysis_started

    PROGRESS_UPDATE --> PROGRESS_UPDATE: state_changed
    PROGRESS_UPDATE --> ANALYSIS_COMPLETE: completed
    PROGRESS_UPDATE --> ANALYSIS_FAILED: error
    PROGRESS_UPDATE --> NO_FUNDING_RESPONSE: no_funding_signal

    NO_FUNDING_RESPONSE --> WAITING_FOR_COMMAND

    ANALYSIS_COMPLETE --> FORMATTING_EMBED: results_ready

    FORMATTING_EMBED --> ATTACHING_FILES
    ATTACHING_FILES --> SENDING_RESPONSE

    SENDING_RESPONSE --> WAITING_FOR_COMMAND: sent

    ANALYSIS_FAILED --> ERROR_RESPONSE
    ERROR_RESPONSE --> WAITING_FOR_COMMAND: error_sent
```

## 5. Complete System Flow

```mermaid
stateDiagram-v2
    [*] --> SYSTEM_IDLE

    state "Discord Layer" as discord {
        WAITING --> COMMAND_RECEIVED
        COMMAND_RECEIVED --> PROCESSING
        PROCESSING --> RESPONSE_SENT
        RESPONSE_SENT --> WAITING
    }

    state "Orchestration Layer" as orchestrator {
        IDLE --> INGESTION
        INGESTION --> ANALYSIS
        ANALYSIS --> RATING
        RATING --> OUTPUT
        OUTPUT --> IDLE
    }

    state "Data Layer" as data {
        FETCHING --> CACHING
        CACHING --> CACHED
    }

    state "AI Layer" as ai {
        PROMPT_BUILDING --> API_CALL
        API_CALL --> RESPONSE_PARSING
        RESPONSE_PARSING --> RESULT_READY
    }

    SYSTEM_IDLE --> discord
    discord --> orchestrator
    orchestrator --> data
    orchestrator --> ai
    ai --> orchestrator
    data --> orchestrator
    orchestrator --> discord
    discord --> SYSTEM_IDLE
```

## State Descriptions

### Analysis States
| State | Description |
|-------|-------------|
| IDLE | System waiting for analysis request |
| FETCHING_DOCUMENTATION | Retrieving project documentation from URL |
| ANALYZING_DOCUMENTATION | AI processing documentation content |
| CHECKING_FUNDING_SIGNAL | Evaluating if funding data should be fetched |
| FETCHING_FUNDING | Querying Messari/CryptoRank APIs |
| ANALYZING_FUNDING | Processing funding round data |
| FETCHING_MARKET_DATA | Querying CoinGecko/CMC APIs |
| ANALYZING_MARKET | AI evaluating market opportunity |
| FETCHING_TEAM_DATA | Extracting team information |
| ANALYZING_TEAM | AI evaluating team background |
| FETCHING_CODE | Querying GitHub API |
| ANALYZING_CODE | AI evaluating repository metrics |
| GENERATING_RATING | AI producing final scores and grade |
| FORMATTING_OUTPUT | Generating JSON and Markdown |
| COMPLETED | Analysis finished successfully |
| FAILED | Analysis encountered error |
| NO_FUNDING | No funding signal detected in docs |

### Transitions
All state transitions are logged with timestamps for debugging and performance monitoring.
