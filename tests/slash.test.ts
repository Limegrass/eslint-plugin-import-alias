import slash from "#src/slash";
describe('slash', () => {
	it('returns the same path for extended-length paths', () => {
		const path = '\\\\?\\C:\\folder\\file.txt';
		expect(slash(path)).toBe(path);
	});

	it('replaces backslashes with forward slashes in standard paths', () => {
		const path = 'C:\\folder\\file.txt';
		expect(slash(path)).toBe('C:/folder/file.txt');
	});

	it('does not modify paths that already use forward slashes', () => {
		const path = 'C:/folder/file.txt';
		expect(slash(path)).toBe(path);
	});

	it('handles paths with mixed slashes', () => {
		const path = 'C:\\folder/subfolder\\file.txt';
		expect(slash(path)).toBe('C:/folder/subfolder/file.txt');
	});

	it('returns an empty string when an empty string is passed', () => {
		const path = '';
		expect(slash(path)).toBe('');
	});
});