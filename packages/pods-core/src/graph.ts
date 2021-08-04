
type GraphCSSItem = {
  selector: string,
  property: string,
}

type GraphCSS = {
  obsidian: GraphCSSItem;
  dendron: GraphCSSItem;
}[]

const graphCSS: GraphCSS = [
  {
    obsidian: {
      selector: '.graph-view.color-fill',
      property: 'color',
    },
    dendron: {
      selector: 'node',
      property: 'background-color'
    }
  },
  {
    obsidian: {
      selector: '.graph-view.color-fill',
      property: 'opacity',
    },
    dendron: {
      selector: 'node',
      property: 'background-opacity'
    }
  },
  {
    obsidian: {
      selector: '.graph-view.color-circle',
      property: 'color',
    },
    dendron: {
      selector: 'node',
      property: 'border-color'
    }
  },
  {
    obsidian: {
      selector: '.graph-view.color-line',
      property: 'color',
    },
    dendron: {
      selector: 'edge',
      property: 'line-color'
    }
  },
  {
    obsidian: {
      selector: '.graph-view.color-line',
      property: 'opacity',
    },
    dendron: {
      selector: 'edge',
      property: 'line-opacity'
    }
  },
  {
    obsidian: {
      selector: '.graph-view.color-text',
      property: 'color',
    },
    dendron: {
      selector: 'node',
      property: 'color'
    }
  },
  {
    obsidian: {
      selector: '.graph-view.color-text',
      property: 'opacity',
    },
    dendron: {
      selector: 'node',
      property: 'text-opacity'
    }
  },
  {
    obsidian: {
      selector: '.graph-view.color-fill-highlight',
      property: 'color',
    },
    dendron: {
      selector: 'node:selected',
      property: 'background-color'
    }
  },
  {
    obsidian: {
      selector: '.graph-view.color-fill-highlight',
      property: 'opacity',
    },
    dendron: {
      selector: 'node:selected',
      property: 'background-opacity'
    }
  },
]

export default graphCSS;