
from ply import yacc
import polyLex

# Get the token map
tokens = polyLex.tokens
global xy

def p_root(p) :
    'root : MULTIPOLYGON OB listOfPoly CB'
    p[0] = p[3]

def p_root2(p) :
    'root : POLYGON  poly '
    p[0] = [p[2]]
            
def p_listOfPoly1(p) :
    'listOfPoly   : listOfPoly comopt poly'
    p[0] = p[1]+[p[3]]

def p_listOfPoly2(p) :
    'listOfPoly   : poly'
    p[0] = [p[1]]
                         
def p_poly(p) :
    'poly : OB listOfContour CB'
    p[0] = p[2]
    
def p_listOfContour1(p) :
    'listOfContour : listOfContour comopt contour'
    p[0] = p[1]+[p[3]]

def p_comopt(p) :
    '''comopt : COM
              | empty '''
    pass
    
def p_listOfContour2(p) :
    'listOfContour : empty'
    p[0] = []
    
def p_contour(p) :
    'contour : OB listOfxy CB'
    p[0] = p[2]
    
def p_listOfxy1(p) :
    'listOfxy : listOfxy COM xy'
    p[0] = p[1]+[p[3]]
    
def p_listOfxy2(p) :
    'listOfxy : xy'
    p[0] = [p[1]]   
    
def p_xy(p) :
    'xy : NUMBER NUMBER'
    global xy
    p[0] = (p[1],p[2])
    xy = p[0]
    
    
def p_empty(t):
    'empty : '
    pass

def p_error(t):
    print "Erreur " , t   
    
    
yacc.yacc(method='LALR')    


data = '''
MULTIPOLYGON( ( (1 2, -3.1 4 ) ,(11 22 ,33 44 ) ) ((11 22 ,33 44 ))  )
'''
data = '''
POLYGON(  (1 2, -3.1 4 ) ,(11 22 ,33 44 )  )
'''

def polyScan(data) :
    return yacc.parse(data)


# Starting point
if __name__ == "__main__":
	print yacc.parse(data)

