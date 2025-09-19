#!/usr/bin/env bun

import { spawn } from "bun";

const proc = spawn({
	cmd: ["bun", "test", "tests/mappers/"],
	cwd: process.cwd(),
	stdio: ["inherit", "inherit", "inherit"],
});

await proc.exited;
