class TrieNode {
  children: Map<string, TrieNode> = new Map()
  isEnd: boolean = false
}

export class Trie {
  private root: TrieNode = new TrieNode()

  insert(word: string): void {
    let node = this.root
    for (const ch of word.toLowerCase()) {
      if (!node.children.has(ch)) {
        node.children.set(ch, new TrieNode())
      }
      node = node.children.get(ch)!
    }
    node.isEnd = true
  }

  search(prefix: string, limit = 5): string[] {
    let node = this.root
    const lowerPrefix = prefix.toLowerCase()
    for (const ch of lowerPrefix) {
      const child = node.children.get(ch)
      if (!child) return []
      node = child
    }
    const results: string[] = []
    this.collect(node, lowerPrefix, results, limit)
    return results
  }

  private collect(node: TrieNode, current: string, results: string[], limit: number): void {
    if (results.length >= limit) return
    if (node.isEnd) results.push(current)
    const sorted = [...node.children.entries()].sort(([a], [b]) => a.localeCompare(b))
    for (const [ch, child] of sorted) {
      if (results.length >= limit) break
      this.collect(child, current + ch, results, limit)
    }
  }
}
