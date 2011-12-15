from ply import lex

tokens = (
    'POLYGON',
    'MULTIPOLYGON',
    'OB',
    'CB',
    'COM',
    'NUMBER'
)

t_POLYGON = r'POLYGON'
t_MULTIPOLYGON = r'MULTIPOLYGON'
t_OB = r'\('
t_CB = r'\)'
t_COM= r','


def t_NUMBER(t):
#    r'((\d+)(\.\d+)(e(\+|-)?(\d+))? | (\d+)e(\+|-)?(\d+))([lL]|[fF])?'
    r'(-)?\d+(\.\d+)?'
    try:
         t.value = float(t.value)    
    except ValueError:
         print "Line %d: Number %s is too large!" % (t.lineno,t.value)
	 t.value = 0
    return t


# Define a rule so we can track line numbers
def t_newline(t):
    r'\n+'
    t.lineno += len(t.value)

# A string containing ignored characters (spaces and tabs)
t_ignore  = ' \t'

# Error handling rule
def t_error(t):
    print "Illegal character '%s'" % t.value[0]
    t.skip(1)

# Build the lexer
lex.lex()

