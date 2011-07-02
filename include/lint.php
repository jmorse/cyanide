<?php

class LintMessage //extends JsonSerializable
{
	private $level;	// one of $levels
	private $message;
	private $lineNumber;
	private $locationHint;
	private $file;

	private static $levels = array(self::error, self::warning);

	const error = 'error';
	const warning = 'warning';

	/**
	 * Attempts to parse the given line using the format of pylint messages.
	 * If successful, it returns a new LintMessage representing the information.
	 * @param line: The line to try to parse.
	 * @returns: A LintMessage representing the error, or null if the parsing failed.
	 */
	public static function FromPyLintLine($line)
	{
		$pattern = '/([^:]+):(\d+): \[(E|W) ?\d*(, (?P<hint>[^\]]+))?\] (?P<msg>.*)/';
		$matches = array();
		if (preg_match($pattern, $line, $matches))
		{
			$level = ($matches[3] == 'W') ? self::warning : self::error;
			$hint = isset($matches['hint']) ? $matches['hint'] : null;
			$lint = new LintMessage($matches[1], $matches[2], $matches['msg'], $hint, $level);
			return $lint;
		}
		return null;
	}

	public function __construct($file, $line, $message, $locationHint = null, $level = self::error)
	{
		$this->file = $file;
		$this->lineNumber = $line;
		$this->locationHint = $locationHint;
		$this->message = $message;

		if (in_array($level, self::$levels))
		{
			$this->level = $level;
		}
		else
		{
			$this->level = self::error;
		}
	}

	public function __get($name)
	{
		if (isset($this->$name))
		{
			return $this->$name;
		}
		return null;
	}

	public function __isset($name)
	{
		if (in_array($name, $this->jsonSerialize()))
		{
			return isset($this->$name);
		}
		return FALSE;
	}

	public function __set($name, $value)
	{
	}

	public function toJSONable()
	{
		$parts = $this->jsonSerialize();
		$out = new StdClass();
		foreach ($parts as $part)
		{
			$out->$part = @$this->$part;
		}
		return $out;
	}

	public function jsonSerialize()
	{
		return array('level', 'message', 'lineNumber', 'file');
	}
}
