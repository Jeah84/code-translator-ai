#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { extname, basename, join, dirname } from "path";
import { resolveLanguage, listLanguages, getOutputExtension } from "./languages";
import { translateCode, translateCodeTogether } from "./translator";
import { validateCode } from "./validator";
import { batchTranslate } from "./batch";
import { getApiKey, setApiKey, checkDailyLimit, incrementDailyCount } from "./config";

const program = new Command();

program
  .name("translate")
  .description("🔄 AI-powered code translator")
  .version("1.0.0");

program
  .command("file <input>", { isDefault: true })
  .alias("f")
  .description("Translate a single file")
  .requiredOption("-f, --from <language>", "Source language")
  .requiredOption("-t, --to <language>", "Target language")
  .option("-o, --output <path>", "Output file path")
  .option("--no-comments", "Strip comments from output")
  .option("--explain", "Add explanatory comments")
  .option("--validate", "Validate output compiles")
  .option("--api-key <key>", "API key")
  .option("--provider <provider>", "Provider: google | openai | together")
  .action(async (input: string, opts) => {
    const provider: "google" | "openai" | "together" = (opts.provider ?? "together") as "google" | "openai" | "together";
    const apiKey = opts.apiKey ?? getApiKey(provider);
    if (!apiKey) {
      console.error(chalk.red("\n✗ No API key found."));
      console.log(chalk.yellow("  Run: translate config --key YOUR_KEY\n"));
      process.exit(1);
    }

    const limit = checkDailyLimit();
    if (!limit.allowed) {
      console.error(chalk.red("\n✗ Daily free limit reached (10/day)."));
      console.log(chalk.yellow("  Run: translate upgrade\n"));
      process.exit(1);
    }

    if (!existsSync(input)) {
      console.error(chalk.red(`\n✗ File not found: ${input}\n`));
      process.exit(1);
    }

    const sourceLang = resolveLanguage(opts.from);
    const targetLang = resolveLanguage(opts.to);
    if (!sourceLang) { console.error(chalk.red(`\n✗ Unknown language: "${opts.from}"\n`)); process.exit(1); }
    if (!targetLang) { console.error(chalk.red(`\n✗ Unknown language: "${opts.to}"\n`)); process.exit(1); }

    const sourceCode = readFileSync(input, "utf-8");
    if (!sourceCode.trim()) { console.error(chalk.red("\n✗ Input file is empty.\n")); process.exit(1); }

    const ext = getOutputExtension(targetLang);
    const outPath = opts.output ?? join(dirname(input), basename(input, extname(input)) + ext);

    console.log(chalk.bold(`\n🔄 Translating `), chalk.cyan(sourceLang.name), chalk.bold("→"), chalk.green(targetLang.name));
    console.log(chalk.dim(`   ${input} → ${outPath}\n`));

    const spinner = ora("Calling AI model...").start();

    try {
      const translateFn = provider === "together" ? translateCodeTogether : translateCode;
      const result = await translateFn(
        {
          sourceLanguage: sourceLang,
          targetLanguage: targetLang,
          sourceCode,
          preserveComments: opts.comments !== false,
          addExplanations: !!opts.explain,
        },
        apiKey
      );
      spinner.succeed(chalk.green("Translation complete!"));
      incrementDailyCount();
      writeFileSync(outPath, result.translatedCode, "utf-8");
      console.log(chalk.green(`\n✓ Saved to: ${outPath}`));
      if (result.tokensUsed) console.log(chalk.dim(`  Tokens used: ${result.tokensUsed.toLocaleString()}`));
      if (limit.tier === "free") console.log(chalk.dim(`  Free tier: ${limit.remaining - 1} translations remaining today`));
      if (result.notes.length > 0) {
        console.log(chalk.yellow("\n📝 Notes:"));
        result.notes.forEach((n) => console.log(chalk.dim(`  • ${n}`)));
      }
      if (result.warnings.length > 0) {
        console.log(chalk.red("\n⚠️  Warnings:"));
        result.warnings.forEach((w) => console.log(chalk.dim(`  • ${w}`)));
      }
      if (opts.validate) {
        const valSpinner = ora("Validating output...").start();
        const validation = await validateCode(result.translatedCode, targetLang);
        if (!validation.checkerAvailable) valSpinner.info(chalk.dim(`Validation skipped — ${targetLang.name} compiler not found`));
        else if (validation.valid) valSpinner.succeed(chalk.green("Output validates successfully ✓"));
        else { valSpinner.fail(chalk.red("Output has compilation errors:")); console.log(chalk.dim(validation.error)); }
      }
      console.log();
    } catch (err) {
      spinner.fail(chalk.red("Translation failed"));
      console.error(chalk.red(`\n✗ ${err instanceof Error ? err.message : String(err)}\n`));
      process.exit(1);
    }
  });

program
  .command("batch <inputDir> <outputDir>")
  .alias("b")
  .description("Translate an entire folder")
  .requiredOption("-f, --from <language>", "Source language")
  .requiredOption("-t, --to <language>", "Target language")
  .option("--validate", "Validate each output file")
  .option("--dry-run", "Preview without translating")
  .option("--api-key <key>", "API key")
  .action(async (inputDir: string, outputDir: string, opts) => {
    const apiKey = opts.apiKey ?? getApiKey();
    if (!apiKey) { console.error(chalk.red("\n✗ No API key. Run: translate config --key YOUR_KEY\n")); process.exit(1); }
    const sourceLang = resolveLanguage(opts.from);
    const targetLang = resolveLanguage(opts.to);
    if (!sourceLang || !targetLang) { console.error(chalk.red("\n✗ Invalid language. Run: translate languages\n")); process.exit(1); }
    if (!existsSync(inputDir)) { console.error(chalk.red(`\n✗ Directory not found: ${inputDir}\n`)); process.exit(1); }

    console.log(chalk.bold(`\n📦 Batch: ${sourceLang.name} → ${targetLang.name}`));
    if (opts.dryRun) console.log(chalk.yellow("   DRY RUN\n"));

    const spinner = ora("Scanning files...").start();
    try {
      const result = await batchTranslate(
        {
          inputDir,
          outputDir,
          sourceLanguage: sourceLang,
          targetLanguage: targetLang,
          apiKey,
          validate: !!opts.validate,
          dryRun: !!opts.dryRun,
        },
        (current, total, file) => { spinner.text = `[${current}/${total}] ${file}`; }
      );
      spinner.stop();
      console.log(chalk.bold("\n📊 Results:"));
      console.log(chalk.green(`  ✓ Succeeded: ${result.succeeded}`));
      if (result.failed > 0) console.log(chalk.red(`  ✗ Failed:    ${result.failed}`));
      if (result.skipped > 0) console.log(chalk.dim(`  ⊘ Skipped:  ${result.skipped}`));
      console.log(chalk.dim(`    Total:     ${result.total}\n`));
    } catch (err) {
      spinner.fail("Batch translation failed");
      console.error(chalk.red(`\n✗ ${err instanceof Error ? err.message : String(err)}\n`));
      process.exit(1);
    }
  });

program
  .command("config")
  .description("Configure API keys and settings")
  .option("--key <apiKey>", "Set API key")
  .option("--provider <provider>", "Provider: google, openai, or together", "together")
  .option("--openai-key <apiKey>", "Set OpenAI API key")
  .option("--show", "Show current configuration")
  .action((opts) => {
    if (opts.key) {
      setApiKey(opts.key, opts.provider as "google" | "openai" | "together");
      console.log(chalk.green(`\n✓ ${opts.provider} API key saved.\n`));
    }
    if (opts.show) {
      const key = getApiKey();
      const limit = checkDailyLimit();
      console.log("\nConfiguration:");
      console.log(`  Google API Key: ${key ? chalk.green(key.slice(0, 8) + "...") : chalk.red("not set")}`);
      console.log(`  Tier:           ${chalk.cyan(limit.tier)}`);
      console.log(`  Today's usage:  ${limit.tier === "free" ? `${10 - limit.remaining}/10` : "unlimited"}\n`);
    }
  });

program
  .command("languages")
  .alias("langs")
  .description("List all supported languages")
  .action(() => listLanguages());

program
  .command("upgrade")
  .description("Upgrade to Pro")
  .action(() => {
    console.log(chalk.bold("\n🚀 Code Translator Pro\n"));
    console.log("  Free:  10 translations/day");
    console.log("  Pro:   Unlimited — $20/month\n");
    console.log(chalk.cyan("  → https://codetranslator.ai/pro\n"));
  });

program.parse(process.argv);
